import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { data: scan, error } = await supabase
            .from('scans')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (error || !scan) {
            return NextResponse.json(
                { error: 'Scan not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ scan })
    } catch (err) {
        console.error('Scan fetch error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
