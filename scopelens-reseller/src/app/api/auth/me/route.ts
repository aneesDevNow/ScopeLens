import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ user: null })
        }

        return NextResponse.json({
            user: {
                email: user.email || "",
                name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            }
        })
    } catch {
        return NextResponse.json({ user: null })
    }
}
