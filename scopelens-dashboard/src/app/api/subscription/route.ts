import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getAdminClient() {
    return createSupabaseClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

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
                    scans_used: count || 0,
                    scans_limit: freePlan?.scans_per_day || 1,
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
                    scans_used: count || 0,
                    scans_limit: freePlan?.scans_per_day || 1,
                },
            })
        }

        // Fetch plan details separately
        const { data: plan } = await supabase
            .from('plans')
            .select('*')
            .eq('id', subscription.plan_id)
            .single()

        // Lazy daily reset — if a new day has started, reset scans_used
        let scansUsed = subscription.scans_used || 0
        const currentPeriodStart = new Date(subscription.current_period_start)
        const nextBillingDate = new Date(currentPeriodStart)
        nextBillingDate.setDate(nextBillingDate.getDate() + 1)

        if (now >= nextBillingDate) {
            const adminClient = getAdminClient()
            const { error: resetError } = await adminClient
                .from('subscriptions')
                .update({
                    scans_used: 0,
                    current_period_start: now.toISOString(),
                    updated_at: now.toISOString()
                })
                .eq('id', subscription.id)

            if (!resetError) {
                scansUsed = 0
            }
        }

        return NextResponse.json({
            subscription,
            plan: plan,
            usage: {
                scans_used: scansUsed,
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
