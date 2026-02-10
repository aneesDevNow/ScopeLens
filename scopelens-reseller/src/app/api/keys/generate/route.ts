import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Service role client for privileged operations (bypass RLS)
function getAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// Generate license key: SL-XXXXX-XXXXX-XXXXX-XXXXX
function generateLicenseKey(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
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

const VALID_CLAIM_HOURS = [5, 24, 48];

// POST /api/keys/generate — Reseller generates license keys using credits
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get reseller profile
        const adminClient = getAdminClient();
        const { data: reseller, error: resellerError } = await adminClient
            .from("resellers")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (resellerError || !reseller) {
            return NextResponse.json({ error: "Reseller profile not found" }, { status: 404 });
        }

        if (reseller.status !== "active") {
            return NextResponse.json({ error: "Your reseller account is not active" }, { status: 403 });
        }

        const body = await request.json();
        const { plan_id, quantity = 1, claim_hours = 24 } = body;

        if (!plan_id) {
            return NextResponse.json({ error: "plan_id is required" }, { status: 400 });
        }

        if (quantity < 1 || quantity > 20) {
            return NextResponse.json({ error: "Quantity must be 1-20" }, { status: 400 });
        }

        if (!VALID_CLAIM_HOURS.includes(claim_hours)) {
            return NextResponse.json({ error: "claim_hours must be 5, 24, or 48" }, { status: 400 });
        }

        // Get plan with reseller pricing
        const { data: plan, error: planError } = await adminClient
            .from("plans")
            .select("id, name, slug, price_monthly, reseller_price_monthly, reseller_discount_percent")
            .eq("id", plan_id)
            .single();

        if (planError || !plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        // Calculate cost using reseller price
        const unitCost = Number(plan.reseller_price_monthly) || Number(plan.price_monthly);
        const totalCost = unitCost * quantity;

        // Check credit balance
        if (Number(reseller.credit_balance) < totalCost) {
            return NextResponse.json({
                error: `Insufficient credits. Need $${totalCost.toFixed(2)}, have $${Number(reseller.credit_balance).toFixed(2)}`
            }, { status: 400 });
        }

        // Calculate claim deadline
        const now = new Date();
        const claimDeadline = new Date(now.getTime() + claim_hours * 60 * 60 * 1000);

        // Generate batch of keys
        const batchId = crypto.randomUUID();
        const keys: {
            key_code: string;
            plan_id: string;
            duration_days: number;
            claim_hours: number;
            claim_deadline: string;
            generated_by: string;
            batch_id: string;
            reseller_id: string;
        }[] = [];

        for (let i = 0; i < quantity; i++) {
            keys.push({
                key_code: generateLicenseKey(),
                plan_id,
                duration_days: 30, // Fixed: subscription lasts 30 days after claiming
                claim_hours,
                claim_deadline: claimDeadline.toISOString(),
                generated_by: user.id,
                batch_id: batchId,
                reseller_id: reseller.id,
            });
        }

        // Insert keys
        const { data: created, error: insertError } = await adminClient
            .from("license_keys")
            .insert(keys)
            .select("id, key_code, status, duration_days, claim_hours, claim_deadline, created_at");

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // Deduct credits
        const newBalance = Number(reseller.credit_balance) - totalCost;
        const { error: updateError } = await adminClient
            .from("resellers")
            .update({
                credit_balance: newBalance,
                updated_at: new Date().toISOString(),
            })
            .eq("id", reseller.id);

        if (updateError) {
            return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 });
        }

        return NextResponse.json({
            keys: created,
            batch_id: batchId,
            plan_name: plan.name,
            quantity: created?.length || 0,
            total_cost: totalCost,
            new_balance: newBalance,
        }, { status: 201 });
    } catch (error) {
        console.error("Key generation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
