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

        // Get all completed scans for stats
        const { data: scans, error } = await supabase
            .from('scans')
            .select('word_count, ai_score, status')
            .eq('user_id', user.id)

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        const completedScans = (scans || []).filter(s => s.status === 'completed')
        const totalWords = completedScans.reduce((sum, s) => sum + (s.word_count || 0), 0)
        const totalScans = scans?.length || 0
        const avgAiScore = completedScans.length > 0
            ? Math.round(completedScans.reduce((sum, s) => sum + (s.ai_score || 0), 0) / completedScans.length)
            : 0

        return NextResponse.json({
            total_words_analyzed: totalWords,
            total_scans: totalScans,
            completed_scans: completedScans.length,
            avg_ai_score: avgAiScore,
        })
    } catch (err) {
        console.error('Scan stats API error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
