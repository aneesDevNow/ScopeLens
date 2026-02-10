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
} from '@/lib/cookie-crypto'

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
                    }));
                },
                setAll(cookiesToSet) {
                    const consolidated = reassembleChunkedCookies(
                        cookiesToSet.map(({ name, value }) => ({ name, value }))
                    );
                    const options = cookiesToSet[0]?.options || {};

                    // Set on request for downstream
                    for (const { name, value } of consolidated) {
                        const customName = toCustomCookieName(name);
                        const encrypted = encryptCookieValue(value);
                        const chunks = splitCookieValue(customName, encrypted);
                        for (const chunk of chunks) {
                            request.cookies.set(chunk.name, chunk.value);
                        }
                    }

                    supabaseResponse = NextResponse.next({ request });

                    // Set on response for browser
                    for (const { name, value } of consolidated) {
                        const customName = toCustomCookieName(name);
                        const encrypted = encryptCookieValue(value);
                        const chunks = splitCookieValue(customName, encrypted);

                        // Cleanup: delete base if chunked, delete old chunks if not
                        if (chunks.length > 1) {
                            supabaseResponse.cookies.delete(customName);
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
                            });
                        }
                    }
                },
            },
        }
    )

    // Public pages — skip auth check
    const { pathname } = request.nextUrl;
    const isPublic = pathname === '/login' ||
        pathname.startsWith('/auth/callback') ||
        pathname.startsWith('/auth/v1/') ||
        pathname === '/forgot-password' ||
        pathname === '/reset-password';

    if (isPublic) return supabaseResponse;

    // Refresh session
    const { data: { user } } = await supabase.auth.getUser()
    const isApiRoute = pathname.startsWith('/api/');

    if (!user && !isApiRoute) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
    }

    // Role isolation
    if (user && !isApiRoute) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const allowedRoles = ['admin', 'manager']
        if (!profile?.role || !allowedRoles.includes(profile.role)) {
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = '/login'
            loginUrl.searchParams.set('error', 'not_admin')
            return NextResponse.redirect(loginUrl)
        }

        if (profile.role === 'manager') {
            const managerAllowedPaths = ['/licenses', '/ai-detection']
            const isAllowed = managerAllowedPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
            if (!isAllowed) {
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/licenses'
                return NextResponse.redirect(redirectUrl)
            }
        }
    }

    return supabaseResponse
}
