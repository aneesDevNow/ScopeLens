import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const { password, access_token, refresh_token } = await req.json()

        if (!password) {
            return NextResponse.json(
                { error: 'Password is required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        if (access_token && refresh_token) {
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
        }

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            console.error('Update password error:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Reset password error:', err)
        return NextResponse.json(
            { error: 'Failed to reset password' },
            { status: 500 }
        )
    }
}
