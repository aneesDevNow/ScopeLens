import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
    encryptCookieValue,
    decryptCookieValue,
    toCustomCookieName,
    toSupabaseCookieName,
    getProjectRef
} from '@/lib/cookie-crypto'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const projectRef = getProjectRef()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Refresh session if expired - IMPORTANT: do not remove this
    const { data: { user } } = await supabase.auth.getUser()

    // If no user and not on an excluded path, redirect to admin login
    const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback')
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
    const isLoginPage = request.nextUrl.pathname === '/login'

    if (!user && !isAuthCallback && !isApiRoute && !isLoginPage) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
    }

    // Role isolation: only admin users can access the admin dashboard
    if (user && !isApiRoute && !isLoginPage && !isAuthCallback) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            // Non-admin users cannot access admin dashboard — redirect to login with error
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = '/login'
            loginUrl.searchParams.set('error', 'not_admin')
            return NextResponse.redirect(loginUrl)
        }
    }

    return supabaseResponse
}
