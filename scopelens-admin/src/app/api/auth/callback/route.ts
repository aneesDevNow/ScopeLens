import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const { access_token, refresh_token } = await req.json()

        if (!access_token || !refresh_token) {
            return NextResponse.json(
                { error: 'Missing authentication tokens' },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
        })

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Auth callback error:', err)
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        )
    }
}
