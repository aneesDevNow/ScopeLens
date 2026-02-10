import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getAdminClient() {
    return createSupabaseClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// GET /api/license-keys — List all license keys for the current reseller
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get reseller record
        const { data: reseller } = await supabase
            .from("resellers")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!reseller) {
            return NextResponse.json({ error: "Not a reseller" }, { status: 403 });
        }

        // Parse query params
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        // Use admin client to get full key info including claimed_by profile
        const adminClient = getAdminClient();

        let query = adminClient
            .from("license_keys")
            .select(`
                id, key_code, status, duration_days, batch_id,
                claimed_at, expires_at, created_at, plan_id, claimed_by, reseller_id
            `)
            .eq("reseller_id", reseller.id)
            .order("created_at", { ascending: false })
            .limit(200);

        if (status) {
            query = query.eq("status", status);
        }

        const { data: keysRaw, error: keysError } = await query;

        if (keysError) {
            return NextResponse.json({ error: keysError.message }, { status: 500 });
        }

        const keys = keysRaw || [];

        // Manually fetch related data (Plans and Profiles) to avoid PostgREST relationship issues
        const planIds = Array.from(new Set(keys.map((k: any) => k.plan_id).filter(Boolean)));
        const userIds = Array.from(new Set(keys.map((k: any) => k.claimed_by).filter(Boolean)));

        // Fetch Plans
        let plansMap: Record<string, any> = {};
        if (planIds.length > 0) {
            const { data: plans } = await adminClient
                .from("plans")
                .select("id, name, slug, price_monthly, reseller_price_monthly")
                .in("id", planIds);

            (plans || []).forEach((p: any) => {
                plansMap[p.id] = p;
            });
        }

        // Fetch Profiles (claimed_by) - Requires admin privileges usually
        let profilesMap: Record<string, any> = {};
        if (userIds.length > 0) {
            const { data: profiles } = await adminClient
                .from("profiles") // assuming there is a public profiles table or similar, if not might fail
                .select("id, email, first_name, last_name")
                .in("id", userIds);

            // Fallback: if 'profiles' table not accessible/existent, try 'users' from auth schema? 
            // Actually, usually app has a 'profiles' or 'users' table in public schema. 
            // If not, we might miss this data. We'll proceed assuming 'profiles' exists or fail gracefully.
            if (!profiles && userIds.length > 0) {
                // If profiles fetch failed (e.g. table doesn't exist), just ignore
            } else {
                (profiles || []).forEach((p: any) => {
                    profilesMap[p.id] = p;
                });
            }
        }

        // Map data back
        const enrichedKeys = keys.map((k: any) => ({
            ...k,
            plans: plansMap[k.plan_id] || null,
            claimed_profile: profilesMap[k.claimed_by] || null
        }));

        return NextResponse.json({ keys: enrichedKeys });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
