import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service role client for privileged operations (bypass RLS)
function getAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// POST /api/claim-key — User claims a license key to activate a plan
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { key_code } = body;

        if (!key_code || typeof key_code !== "string") {
            return NextResponse.json({ error: "License key is required" }, { status: 400 });
        }

        // Normalize key: trim, uppercase
        const normalizedKey = key_code.trim().toUpperCase();

        // Use service role client to FIND the key (bypassing RLS issue where users can't see available keys)
        const adminClient = getAdminClient();

        // Find the key
        const { data: licenseKey, error: findError } = await adminClient
            .from("license_keys")
            .select("id, plan_id, duration_days, status")
            .eq("key_code", normalizedKey)
            .single();

        if (findError || !licenseKey) {
            return NextResponse.json({ error: "Invalid license key" }, { status: 404 });
        }

        if (licenseKey.status !== "available") {
            const messages: Record<string, string> = {
                claimed: "This key has already been claimed",
                expired: "This key has expired",
                revoked: "This key has been revoked",
            };
            return NextResponse.json({
                error: messages[licenseKey.status] || "Key is not available"
            }, { status: 400 });
        }

        // Claim the key: update status and set claimed_by
        const now = new Date();
        const expiresAt = new Date(now.getTime() + licenseKey.duration_days * 24 * 60 * 60 * 1000);

        const { error: claimError } = await adminClient
            .from("license_keys")
            .update({
                status: "claimed",
                claimed_by: user.id,
                claimed_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
                updated_at: now.toISOString(),
            })
            .eq("id", licenseKey.id)
            .eq("status", "available"); // Double-check it's still available

        if (claimError) {
            return NextResponse.json({ error: "Failed to claim key. It may have been claimed by someone else." }, { status: 409 });
        }

        // Use service role client for subscription operations (bypasses RLS)
        // adminClient is already defined above

        // Activate subscription: upsert subscription for this user
        const { data: existingSub } = await adminClient
            .from("subscriptions")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (existingSub) {
            // Update existing subscription
            await adminClient
                .from("subscriptions")
                .update({
                    plan_id: licenseKey.plan_id,
                    status: "active",
                    scans_used: 0,
                    current_period_end: expiresAt.toISOString(),
                    updated_at: now.toISOString(),
                })
                .eq("id", existingSub.id);
        } else {
            // Create new subscription
            await adminClient
                .from("subscriptions")
                .insert({
                    user_id: user.id,
                    plan_id: licenseKey.plan_id,
                    status: "active",
                    scans_used: 0,
                    current_period_start: now.toISOString(),
                    current_period_end: expiresAt.toISOString(),
                });
        }

        // Fetch plan details separately to avoid PostgREST relationship issues
        const { data: plan } = await adminClient
            .from("plans")
            .select("name, slug, scans_per_month")
            .eq("id", licenseKey.plan_id)
            .single();

        return NextResponse.json({
            message: `Plan "${plan?.name || "Premium"}" activated successfully!`,
            plan_name: plan?.name,
            expires_at: expiresAt.toISOString(),
            scans_per_month: plan?.scans_per_month,
        });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
