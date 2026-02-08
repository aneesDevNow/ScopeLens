import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
                claimed_at, expires_at, created_at,
                plans:plan_id (name, slug, price_monthly, reseller_price_monthly),
                claimed_profile:claimed_by (email, first_name, last_name)
            `)
            .eq("reseller_id", reseller.id)
            .order("created_at", { ascending: false })
            .limit(200);

        if (status) {
            query = query.eq("status", status);
        }

        const { data: keys, error: keysError } = await query;

        if (keysError) {
            return NextResponse.json({ error: keysError.message }, { status: 500 });
        }

        return NextResponse.json({ keys: keys || [] });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
