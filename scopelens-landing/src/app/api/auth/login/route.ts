import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

export async function POST(request: Request) {
    try {
        // Rate limiting: 5 attempts per 15 minutes per IP
        const clientIP = getClientIP(request);
        const rateLimit = checkRateLimit(`login:${clientIP}`, {
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxRequests: 5,
        });

        if (!rateLimit.allowed) {
            const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(retryAfter),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(rateLimit.resetTime),
                    }
                }
            );
        }

        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

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

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: data.user?.id,
                email: data.user?.email,
            },
            // Session is managed via secure HTTP-only cookies - no need to expose tokens
        })
    } catch (err) {
        console.error('Login error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
