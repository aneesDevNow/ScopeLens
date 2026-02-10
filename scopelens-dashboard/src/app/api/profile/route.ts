import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ profile, country: user.user_metadata?.country || null })
    } catch (err) {
        console.error('Profile API error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const updates = await request.json()

        // Build update object dynamically — only include fields that are provided
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        }

        if (updates.firstName !== undefined) updateData.first_name = updates.firstName
        if (updates.lastName !== undefined) updateData.last_name = updates.lastName
        if (updates.institution !== undefined) updateData.institution = updates.institution
        if (updates.two_factor_enabled !== undefined) updateData.two_factor_enabled = updates.two_factor_enabled
        if (updates.email_notifications !== undefined) updateData.email_notifications = updates.email_notifications
        if (updates.weekly_report !== undefined) updateData.weekly_report = updates.weekly_report

        const { data: profile, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)
            .select()
            .single()

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json({ profile })
    } catch (err) {
        console.error('Profile update error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
