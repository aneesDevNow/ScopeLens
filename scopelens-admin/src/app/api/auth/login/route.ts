import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()

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

        return NextResponse.json({ success: true, role: profile.role })
    } catch (err) {
        console.error('Login error:', err)
        return NextResponse.json(
            { error: 'An error occurred. Please try again.' },
            { status: 500 }
        )
    }
}
