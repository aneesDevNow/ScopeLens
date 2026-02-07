import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ scanId: string }> }
) {
    try {
        const supabase = await createClient()
        const { scanId } = await params

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { data: report, error } = await supabase
            .from('reports')
            .select('*, scans(*)')
            .eq('scan_id', scanId)
            .eq('user_id', user.id)
            .single()

        if (error || !report) {
            return NextResponse.json(
                { error: 'Report not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ report })
    } catch (err) {
        console.error('Report fetch error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
