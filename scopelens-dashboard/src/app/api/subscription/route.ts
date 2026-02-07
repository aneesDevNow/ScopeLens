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

        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('*, plans(*)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

        if (error || !subscription) {
            // Return free plan if no active subscription
            const { data: freePlan } = await supabase
                .from('plans')
                .select('*')
                .eq('slug', 'free')
                .single()

            return NextResponse.json({
                subscription: null,
                plan: freePlan,
                usage: {
                    scans_used: 0,
                    scans_limit: freePlan?.scans_per_month || 5,
                },
            })
        }

        return NextResponse.json({
            subscription,
            plan: subscription.plans,
            usage: {
                scans_used: subscription.scans_used,
                scans_limit: subscription.plans?.scans_per_month || 0,
            },
        })
    } catch (err) {
        console.error('Subscription API error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
