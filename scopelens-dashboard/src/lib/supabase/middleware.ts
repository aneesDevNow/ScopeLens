import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
    encryptCookieValue,
    decryptCookieValue,
    toCustomCookieName,
    toSupabaseCookieName,
    getProjectRef,
    splitCookieValue,
    reassembleChunkedCookies,
} from '@/lib/cookie-utils'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })
    const projectRef = getProjectRef()

    const supabase = createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    const raw = request.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
                    const reassembled = reassembleChunkedCookies(raw);
                    return reassembled.map(cookie => ({
                        name: toSupabaseCookieName(cookie.name, projectRef),
                        value: decryptCookieValue(cookie.value),
                    }))
                },
                setAll(cookiesToSet) {
                    const consolidated = reassembleChunkedCookies(
                        cookiesToSet.map(({ name, value }) => ({ name, value }))
                    );
                    const options = cookiesToSet[0]?.options || {};

                    for (const { name, value } of consolidated) {
                        const customName = toCustomCookieName(name)
                        const encrypted = encryptCookieValue(value)
                        const chunks = splitCookieValue(customName, encrypted)
                        for (const chunk of chunks) {
                            request.cookies.set(chunk.name, chunk.value)
                        }
                    }

                    supabaseResponse = NextResponse.next({ request })

                    for (const { name, value } of consolidated) {
                        const customName = toCustomCookieName(name)
                        const encrypted = encryptCookieValue(value)
                        const chunks = splitCookieValue(customName, encrypted)

                        if (chunks.length > 1) {
                            supabaseResponse.cookies.delete(customName)
                        } else {
                            for (let i = 0; i < 5; i++) {
                                try { supabaseResponse.cookies.delete(`${customName}.${i}`); } catch { }
                            }
                        }

                        for (const chunk of chunks) {
                            supabaseResponse.cookies.set(chunk.name, chunk.value, {
                                ...options,
                                httpOnly: true,
                                secure: process.env.NODE_ENV === 'production',
                                sameSite: 'lax',
                            })
                        }
                    }
                },
            },
        }
    )

    // Public pages
    const { pathname } = request.nextUrl;
    const isAuthCallback = pathname.startsWith('/auth/callback')
    const isApiRoute = pathname.startsWith('/api/')
    const isLoginPage = pathname === '/login'
    const isSignupPage = pathname === '/signup'
    const isForgotPassword = pathname === '/forgot-password'
    const isResetPassword = pathname === '/reset-password'
    const isRootPage = pathname === '/'

    if (isRootPage || isAuthCallback || isForgotPassword || isResetPassword) {
        return supabaseResponse
    }

    // Redirect logged-in users away from login/signup
    if (isLoginPage || isSignupPage) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const dashboardUrl = request.nextUrl.clone()
            dashboardUrl.pathname = '/scan'
            return NextResponse.redirect(dashboardUrl)
        }
        return supabaseResponse
    }

    // Refresh session
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isApiRoute) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
    }

    // Role isolation: block admin users from dashboard
    if (user && !isApiRoute && !isLoginPage && !isAuthCallback) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'admin') {
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = '/login'
            loginUrl.searchParams.set('error', 'admin_only')
            return NextResponse.redirect(loginUrl)
        }
    }

    return supabaseResponse
}
