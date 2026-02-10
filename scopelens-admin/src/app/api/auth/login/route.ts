import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
    encryptCookieValue,
    decryptCookieValue,
    toCustomCookieName,
    toSupabaseCookieName,
    getProjectRef
} from '@/lib/cookie-crypto'

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        const projectRef = getProjectRef()

        // Capture cookies that Supabase wants to set
        const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

        const supabase = createServerClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return req.cookies.getAll().map(cookie => ({
                            name: toSupabaseCookieName(cookie.name, projectRef),
                            value: decryptCookieValue(cookie.value),
                        }))
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            pendingCookies.push({
                                name: toCustomCookieName(name),
                                value: encryptCookieValue(value),
                                options: {
                                    ...options,
                                    httpOnly: true,
                                    secure: process.env.NODE_ENV === 'production',
                                    sameSite: 'lax' as const,
                                },
                            })
                        })
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            )
        }

        if (!data.session) {
            return NextResponse.json(
                { error: 'No session created' },
                { status: 401 }
            )
        }

        // Check if user is an admin
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

        if (profileError || !profile) {
            await supabase.auth.signOut()
            return NextResponse.json(
                { error: 'Failed to verify admin status' },
                { status: 403 }
            )
        }

        const allowedRoles = ['admin', 'manager']
        if (!allowedRoles.includes(profile.role)) {
            await supabase.auth.signOut()
            return NextResponse.json(
                { error: 'Access denied. Administrator or manager privileges required.' },
                { status: 403 }
            )
        }

        // Create response and explicitly set all cookies on it
        const response = NextResponse.json({ success: true, role: profile.role })

        pendingCookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as Record<string, string>)
        })

        return response
    } catch (err) {
        console.error('Login error:', err)
        return NextResponse.json(
            { error: 'An error occurred. Please try again.' },
            { status: 500 }
        )
    }
}
