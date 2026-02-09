import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import crypto from "crypto";

const getAdminClient = () => {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

// Generate license key: SL-XXXXX-XXXXX-XXXXX-XXXXX
function generateLicenseKey(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous: 0/O, 1/I
    const segments = 4;
    const segLen = 5;
    const parts: string[] = [];
    for (let i = 0; i < segments; i++) {
        let seg = "";
        for (let j = 0; j < segLen; j++) {
            seg += chars[crypto.randomInt(chars.length)];
        }
        parts.push(seg);
    }
    return `SL-${parts.join("-")}`;
}

// POST /api/admin/license-keys — Generate license keys (admin only)
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Admin check
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile || !["admin", "manager"].includes(profile.role)) {
            return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
        }

        const body = await request.json();
        const { plan_id, quantity = 1, duration_days = 30, reseller_id } = body;

        if (!plan_id) {
            return NextResponse.json({ error: "plan_id is required" }, { status: 400 });
        }

        if (quantity < 1 || quantity > 100) {
            return NextResponse.json({ error: "Quantity must be 1-100" }, { status: 400 });
        }

        // Verify plan exists
        const { data: plan } = await supabase
            .from("plans")
            .select("id, name")
            .eq("id", plan_id)
            .single();

        if (!plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        // Generate batch of keys
        const batchId = crypto.randomUUID();
        const keys: { key_code: string; plan_id: string; duration_days: number; generated_by: string; batch_id: string; reseller_id: string | null }[] = [];

        for (let i = 0; i < quantity; i++) {
            keys.push({
                key_code: generateLicenseKey(),
                plan_id,
                duration_days,
                generated_by: user.id,
                batch_id: batchId,
                reseller_id: reseller_id || null,
            });
        }

        const { data: created, error: insertError } = await supabase
            .from("license_keys")
            .insert(keys)
            .select("id, key_code, status, duration_days, created_at");

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({
            keys: created,
            batch_id: batchId,
            plan_name: plan.name,
            quantity: created?.length || 0
        }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET /api/admin/license-keys — List all license keys (admin only)
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Admin check
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile || !["admin", "manager"].includes(profile.role)) {
            return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const batch_id = searchParams.get("batch_id");

        // Use admin client to bypass RLS
        const admin = getAdminClient();

        let query = admin
            .from("license_keys")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(200);

        if (status) query = query.eq("status", status);
        if (batch_id) query = query.eq("batch_id", batch_id);

        const { data: rawKeys, error: keysError } = await query;

        if (keysError) {
            return NextResponse.json({ error: keysError.message }, { status: 500 });
        }

        const keysList = rawKeys || [];

        // Batch-fetch plan names
        const planIds = [...new Set(keysList.map(k => k.plan_id).filter(Boolean))];
        let planMap = new Map<string, { name: string; slug: string }>();
        if (planIds.length > 0) {
            const { data: plans } = await admin
                .from("plans")
                .select("id, name, slug")
                .in("id", planIds);
            planMap = new Map((plans || []).map(p => [p.id, { name: p.name, slug: p.slug }]));
        }

        // Batch-fetch claimed-by profiles
        const claimedByIds = [...new Set(keysList.map(k => k.claimed_by).filter(Boolean))];
        let profileMap = new Map<string, { first_name: string; last_name: string }>();
        if (claimedByIds.length > 0) {
            const { data: profiles } = await admin
                .from("profiles")
                .select("id, first_name, last_name")
                .in("id", claimedByIds);
            profileMap = new Map((profiles || []).map(p => [p.id, { first_name: p.first_name, last_name: p.last_name }]));
        }

        // Merge data
        const keys = keysList.map(key => ({
            id: key.id,
            key_code: key.key_code,
            status: key.status,
            duration_days: key.duration_days,
            batch_id: key.batch_id,
            claimed_at: key.claimed_at,
            expires_at: key.expires_at,
            created_at: key.created_at,
            plans: planMap.get(key.plan_id) || null,
            claimed_profile: key.claimed_by ? (profileMap.get(key.claimed_by) || null) : null,
        }));

        return NextResponse.json({ keys });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/admin/license-keys — Revoke a license key (admin only)
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Admin check
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile || !["admin", "manager"].includes(profile.role)) {
            return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const keyId = searchParams.get("id");
        if (!keyId) {
            return NextResponse.json({ error: "Missing key ID" }, { status: 400 });
        }

        const { error: updateError } = await supabase
            .from("license_keys")
            .update({ status: "revoked", updated_at: new Date().toISOString() })
            .eq("id", keyId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Key revoked" });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
