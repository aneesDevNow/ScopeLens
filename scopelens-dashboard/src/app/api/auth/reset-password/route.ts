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

        // If tokens are provided, set the session first (coming from email link)
        if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token })
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
