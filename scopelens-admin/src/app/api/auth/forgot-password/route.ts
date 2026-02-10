import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://admin.scopelens.ai'}/reset-password`,
        })

        if (error) {
            console.error('Reset password error:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Forgot password error:', err)
        return NextResponse.json(
            { error: 'Failed to send reset email' },
            { status: 500 }
        )
    }
}
