import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ loggedIn: false, currentPlan: null })
        }

        // Fetch user's current plan
        let currentPlan: string | null = null
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('plan_id')
                .eq('id', user.id)
                .single()

            if (profile?.plan_id) {
                // User has an assigned plan — look up its slug
                const { data: plan } = await supabase
                    .from('plans')
                    .select('slug')
                    .eq('id', profile.plan_id)
                    .single()
                currentPlan = plan?.slug || 'free'
            } else {
                // No plan_id means user is on the free plan
                currentPlan = 'free'
            }
        } catch {
            currentPlan = 'free'
        }

        return NextResponse.json({ loggedIn: true, currentPlan })
    } catch {
        return NextResponse.json({ loggedIn: false, currentPlan: null })
    }
}
