import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSSRClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
    try {
        const { password, code, access_token, refresh_token } = await req.json()

        if (!password) {
            return NextResponse.json(
                { error: 'Password is required' },
                { status: 400 }
            )
        }

        // PKCE flow: exchange code for session, then update password
        if (code) {
            const supabase = await createSSRClient()
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
                console.error('Code exchange error:', exchangeError)
                return NextResponse.json(
                    { error: 'Invalid or expired reset link. Please request a new one.' },
                    { status: 400 }
                )
            }

            const { error: updateError } = await supabase.auth.updateUser({ password })

            if (updateError) {
                console.error('Update password error:', updateError)
                return NextResponse.json(
                    { error: updateError.message },
                    { status: 400 }
                )
            }

            return NextResponse.json({ success: true })
        }

        // Implicit flow: set session from tokens, then update password
        if (access_token && refresh_token) {
            const supabase = createClient(
                process.env.SUPABASE_URL!,
                process.env.SUPABASE_ANON_KEY!
            )

            const { error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
            })

            if (sessionError) {
                console.error('Session error:', sessionError)
                return NextResponse.json(
                    { error: 'Invalid or expired reset link. Please request a new one.' },
                    { status: 400 }
                )
            }

            const { error: updateError } = await supabase.auth.updateUser({ password })

            if (updateError) {
                console.error('Update password error:', updateError)
                return NextResponse.json(
                    { error: updateError.message },
                    { status: 400 }
                )
            }

            return NextResponse.json({ success: true })
        }

        return NextResponse.json(
            { error: 'Invalid or expired reset link. Please request a new one.' },
            { status: 400 }
        )
    } catch (err) {
        console.error('Reset password error:', err)
        return NextResponse.json(
            { error: 'Failed to reset password' },
            { status: 500 }
        )
    }
}
