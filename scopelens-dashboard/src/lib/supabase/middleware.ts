import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
    encryptCookieValue,
    decryptCookieValue,
    toCustomCookieName,
    toSupabaseCookieName,
    getProjectRef
} from '@/lib/cookie-utils'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const projectRef = getProjectRef()

    const supabase = createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    // Read cookies from browser, decrypt and remap names back to Supabase format
                    const allCookies = request.cookies.getAll()
                    return allCookies.map(cookie => {
                        const supabaseName = toSupabaseCookieName(cookie.name, projectRef)
                        const decryptedValue = decryptCookieValue(cookie.value)
                        return { name: supabaseName, value: decryptedValue }
                    })
                },
                setAll(cookiesToSet) {
                    // Encrypt and remap cookie names before setting
                    cookiesToSet.forEach(({ name, value }) => {
                        const customName = toCustomCookieName(name)
                        const encryptedValue = encryptCookieValue(value)
                        request.cookies.set(customName, encryptedValue)
                    })
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        const customName = toCustomCookieName(name)
                        const encryptedValue = encryptCookieValue(value)
                        supabaseResponse.cookies.set(customName, encryptedValue, {
                            ...options,
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'lax',
                        })
                    })
                },
            },
        }
    )

    // Check if this is a public page BEFORE calling getUser() to avoid burning rate limits
    const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback')
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
    const isLoginPage = request.nextUrl.pathname === '/login'
    const isSignupPage = request.nextUrl.pathname === '/signup'
    const isForgotPassword = request.nextUrl.pathname === '/forgot-password'
    const isResetPassword = request.nextUrl.pathname === '/reset-password'
    const isRootPage = request.nextUrl.pathname === '/'

    // Skip auth check for auth callback, landing page, and password reset pages
    if (isRootPage || isAuthCallback || isForgotPassword || isResetPassword) {
        return supabaseResponse
    }

    // For login/signup pages: if user is already logged in, redirect to dashboard
    if (isLoginPage || isSignupPage) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const dashboardUrl = request.nextUrl.clone()
            dashboardUrl.pathname = '/scan'
            return NextResponse.redirect(dashboardUrl)
        }
        return supabaseResponse
    }

    // Refresh session if expired - IMPORTANT: do not remove this
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isApiRoute) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
    }

    // Role isolation: block admin users from accessing the user dashboard
    if (user && !isApiRoute && !isLoginPage && !isAuthCallback) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'admin') {
            // Admin users should not use the dashboard — redirect to login with error
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = '/login'
            loginUrl.searchParams.set('error', 'admin_only')
            return NextResponse.redirect(loginUrl)
        }
    }

    return supabaseResponse
}
