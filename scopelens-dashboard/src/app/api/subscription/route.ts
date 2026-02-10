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
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle()

        // Helper: return free plan response
        const returnFreePlan = async () => {
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
                    scans_limit: freePlan?.scans_per_day || 1,
                },
            })
        }

        if (error || !subscription) {
            return returnFreePlan()
        }

        // Check if subscription period has expired
        const now = new Date()
        const periodEnd = new Date(subscription.current_period_end)
        if (periodEnd < now) {
            // Subscription expired — fall back to free tier
            return returnFreePlan()
        }

        // Fetch plan details separately
        const { data: plan } = await supabase
            .from('plans')
            .select('*')
            .eq('id', subscription.plan_id)
            .single()

        return NextResponse.json({
            subscription,
            plan: plan,
            usage: {
                scans_used: subscription.scans_used,
                scans_limit: plan?.scans_per_day || 0,
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
