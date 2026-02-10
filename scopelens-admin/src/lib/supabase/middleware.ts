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
    const isForgotPassword = request.nextUrl.pathname === '/forgot-password'
    const isResetPassword = request.nextUrl.pathname === '/reset-password'

    // Skip auth check entirely for public pages
    if (isLoginPage || isAuthCallback || isAuthVerify || isForgotPassword || isResetPassword) {
        return supabaseResponse
    }

    // Refresh session if expired - IMPORTANT: do not remove this
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isApiRoute) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
    }

    // Role isolation: only admin and manager users can access the admin dashboard
    if (user && !isApiRoute && !isLoginPage && !isAuthCallback) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const allowedRoles = ['admin', 'manager']
        if (!profile?.role || !allowedRoles.includes(profile.role)) {
            // Unauthorized users cannot access admin dashboard — redirect to login with error
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = '/login'
            loginUrl.searchParams.set('error', 'not_admin')
            return NextResponse.redirect(loginUrl)
        }

        // Manager route restriction: only /licenses and /ai-detection
        if (profile.role === 'manager') {
            const managerAllowedPaths = ['/licenses', '/ai-detection']
            const currentPath = request.nextUrl.pathname
            const isAllowed = managerAllowedPaths.some(p => currentPath === p || currentPath.startsWith(p + '/'))
            if (!isAllowed) {
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/licenses'
                return NextResponse.redirect(redirectUrl)
            }
        }
    }

    return supabaseResponse
}
