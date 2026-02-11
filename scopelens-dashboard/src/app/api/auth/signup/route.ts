import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    return createAdminClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

export async function POST(req: NextRequest) {
    try {
        const { email, password, firstName, lastName } = await req.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const { data: signUpData, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                },
            },
        })

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        // Also save first_name/last_name to profiles table
        if (signUpData?.user?.id && (firstName || lastName)) {
            const admin = getAdminClient();
            await admin
                .from('profiles')
                .upsert({
                    id: signUpData.user.id,
                    first_name: firstName || null,
                    last_name: lastName || null,
                }, { onConflict: 'id' });
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Signup error:', err)
        return NextResponse.json(
            { error: 'An error occurred. Please try again.' },
            { status: 500 }
        )
    }
}
