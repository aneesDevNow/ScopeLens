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
            .single()

        const now = new Date()

        if (error || !subscription) {
            // Return free plan if no active subscription
            const { data: freePlan } = await supabase
                .from('plans')
                .select('*')
                .eq('slug', 'free')
                .single()

            // Count today's scans for free users (calendar day)
            const startOfDay = new Date()
            startOfDay.setHours(0, 0, 0, 0)
            const { count } = await supabase
                .from('scans')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', startOfDay.toISOString())

            return NextResponse.json({
                subscription: null,
                plan: freePlan,
                usage: {
                    credits_remaining: Math.max(0, (freePlan?.credits || 1) - (count || 0)),
                    credits_total: freePlan?.credits || 1,
                    credits_expires_at: null,
                    is_free_tier: true,
                },
            })
        }

        // Check if subscription is expired
        const currentPeriodEnd = new Date(subscription.current_period_end)
        if (currentPeriodEnd < now) {
            // Expired subscription — treat as free tier
            const { data: freePlan } = await supabase
                .from('plans')
                .select('*')
                .eq('slug', 'free')
                .single()

            const startOfDay = new Date()
            startOfDay.setHours(0, 0, 0, 0)
            const { count } = await supabase
                .from('scans')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', startOfDay.toISOString())

            return NextResponse.json({
                subscription: null,
                plan: freePlan,
                usage: {
                    credits_remaining: Math.max(0, (freePlan?.credits || 1) - (count || 0)),
                    credits_total: freePlan?.credits || 1,
                    credits_expires_at: null,
                    is_free_tier: true,
                },
            })
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
                credits_remaining: subscription.credits_remaining ?? 0,
                credits_total: plan?.credits || 0,
                credits_expires_at: subscription.credits_expires_at || null,
                is_free_tier: false,
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
