import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCSRFToken } from "@/lib/csrf";

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get reseller profile
        const { data: resellerProfile } = await supabase
            .from("reseller_profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!resellerProfile) {
            return NextResponse.json({ error: "Reseller profile not found" }, { status: 404 });
        }

        // Get all clients with plan names
        const { data: clients, error } = await supabase
            .from("reseller_clients")
            .select(`
                *,
                plans (
                    name,
                    price_monthly,
                    price_yearly
                )
            `)
            .eq("reseller_id", resellerProfile.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching clients:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ clients: clients || [] });
    } catch (error) {
        console.error("Reseller clients error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        // CSRF validation for state-changing requests
        const isValidCSRF = await validateCSRFToken(request);
        if (!isValidCSRF) {
            return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
        }

        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get reseller profile
        const { data: resellerProfile } = await supabase
            .from("reseller_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (!resellerProfile) {
            return NextResponse.json({ error: "Reseller profile not found" }, { status: 404 });
        }

        if (!resellerProfile.is_active) {
            return NextResponse.json({ error: "Reseller account is blocked" }, { status: 403 });
        }

        const body = await request.json();
        const { client_name, client_email, plan_id, billing_cycle = "monthly" } = body;

        if (!client_name || !client_email || !plan_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get plan details
        const { data: plan } = await supabase
            .from("plans")
            .select("*")
            .eq("id", plan_id)
            .single();

        if (!plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        // Calculate prices
        const retailPrice = billing_cycle === "monthly" ? plan.price_monthly : plan.price_yearly;
        const resellerCost = billing_cycle === "monthly" ? plan.reseller_price_monthly : plan.reseller_price_yearly;
        const profit = retailPrice - resellerCost;

        // Check sufficient credits
        if (resellerProfile.credit_balance < resellerCost) {
            return NextResponse.json({
                error: "Insufficient credits",
                required: resellerCost,
                available: resellerProfile.credit_balance
            }, { status: 400 });
        }

        // Calculate expiry date
        const expiresAt = new Date();
        if (billing_cycle === "monthly") {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        // Create client record
        const { data: client, error: clientError } = await supabase
            .from("reseller_clients")
            .insert({
                reseller_id: resellerProfile.id,
                client_name,
                client_email,
                plan_id,
                billing_cycle,
                retail_price: retailPrice,
                reseller_cost: resellerCost,
                profit,
                status: "active",
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (clientError) {
            console.error("Error creating client:", clientError);
            return NextResponse.json({ error: clientError.message }, { status: 500 });
        }

        // Deduct credits from reseller
        const newBalance = resellerProfile.credit_balance - resellerCost;
        const newTotalSpent = resellerProfile.total_spent + resellerCost;
        const newCommissionEarned = resellerProfile.commission_earned + profit;

        await supabase
            .from("reseller_profiles")
            .update({
                credit_balance: newBalance,
                total_spent: newTotalSpent,
                commission_earned: newCommissionEarned,
                updated_at: new Date().toISOString(),
            })
            .eq("id", resellerProfile.id);

        // Create transaction record
        await supabase
            .from("reseller_transactions")
            .insert({
                reseller_id: resellerProfile.id,
                type: "client_activation",
                amount: -resellerCost,
                balance_after: newBalance,
                description: `Activated ${client_name} on ${plan.name} (${billing_cycle})`,
                reference_id: client.id,
            });

        return NextResponse.json({
            client,
            new_balance: newBalance,
            profit
        }, { status: 201 });
    } catch (error) {
        console.error("Create client error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
