import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

export async function POST(request: Request) {
    try {
        // Rate limiting: 3 signups per hour per IP
        const clientIP = getClientIP(request);
        const rateLimit = checkRateLimit(`signup:${clientIP}`, {
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 3,
        });

        if (!rateLimit.allowed) {
            const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
            return NextResponse.json(
                { error: 'Too many signup attempts. Please try again later.' },
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

        const { email, password, firstName, lastName, institution, country } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    institution: institution,
                    country: country || null,
                },
            },
        })

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json({
            message: 'Signup successful',
            user: {
                id: data.user?.id,
                email: data.user?.email,
            },
        })
    } catch (err) {
        console.error('Signup error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
