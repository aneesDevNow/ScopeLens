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
    const isAuthVerify = request.nextUrl.pathname.startsWith('/auth/v1/')
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
    const isLoginPage = request.nextUrl.pathname === '/login'
    const isSignupPage = request.nextUrl.pathname === '/signup'
    const isForgotPassword = request.nextUrl.pathname === '/forgot-password'
    const isResetPassword = request.nextUrl.pathname === '/reset-password'
    const isRootPage = request.nextUrl.pathname === '/'

    console.log(`[MW] ${request.method} ${request.nextUrl.pathname} | public=${isLoginPage || isSignupPage || isRootPage || isAuthCallback || isForgotPassword || isResetPassword}`)

    // Skip auth check for auth callback, landing page, and password reset pages
    if (isRootPage || isAuthCallback || isAuthVerify || isForgotPassword || isResetPassword) {
        return supabaseResponse
    }

    // For login/signup pages: if user is already logged in, redirect to dashboard
    if (isLoginPage || isSignupPage) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const dashboardUrl = request.nextUrl.clone()
            dashboardUrl.pathname = '/dashboard'
            return NextResponse.redirect(dashboardUrl)
        }
        return supabaseResponse
    }

    // Refresh session if expired - IMPORTANT: do not remove this
    console.log(`[MW] >>> getUser() called for ${request.nextUrl.pathname}`)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isApiRoute) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
    }

    // Role isolation: only reseller users can access the reseller portal
    if (user && !isApiRoute && !isLoginPage && !isAuthCallback && !isSignupPage && !isRootPage) {
        console.log(`[MW] Checking role for user ${user.id}`)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        console.log(`[MW] Profile result:`, profile, `Error:`, profileError)

        if (profile?.role !== 'reseller' && profile?.role !== 'admin') {
            // Non-reseller users cannot access the reseller portal — redirect to login with error
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = '/login'
            loginUrl.searchParams.set('error', 'not_reseller')
            return NextResponse.redirect(loginUrl)
        }
    }

    return supabaseResponse
}
