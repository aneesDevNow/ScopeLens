import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Auth check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse body
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { packageId } = body;
        if (!packageId) {
            return NextResponse.json({ error: "Missing packageId" }, { status: 400 });
        }

        // 3. Validate package from DB
        const { data: pkg, error: pkgError } = await supabase
            .from("credit_packages")
            .select("*")
            .eq("id", packageId)
            .single();

        if (pkgError || !pkg) {
            return NextResponse.json({ error: "Invalid package or package not found" }, { status: 404 });
        }

        if (!pkg.is_active) {
            return NextResponse.json({ error: "This package is no longer active" }, { status: 400 });
        }

        const totalCredits = pkg.credits + (pkg.bonus_credits || 0);

        // 4. Get reseller record
        const { data: reseller, error: resellerErr } = await supabase
            .from("resellers")
            .select("id, credit_balance")
            .eq("user_id", user.id)
            .single();

        if (resellerErr || !reseller) {
            return NextResponse.json({ error: "Reseller profile not found" }, { status: 404 });
        }

        const newBalance = (reseller.credit_balance || 0) + totalCredits;

        // 5. Record the transaction
        const { error: txError } = await supabase
            .from("reseller_transactions")
            .insert({
                reseller_id: reseller.id,
                type: "credit_purchase",
                amount: totalCredits,
                balance_after: newBalance,
                description: `Purchased ${pkg.name} package: ${pkg.credits} credits${pkg.bonus_credits > 0 ? ` + ${pkg.bonus_credits} bonus` : ""}`,
                created_by: user.id,
            });

        if (txError) {
            console.error("Transaction insert error:", txError);
            return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
        }

        // 6. Update reseller balance
        const { error: updateErr } = await supabase
            .from("resellers")
            .update({ credit_balance: newBalance, updated_at: new Date().toISOString() })
            .eq("id", reseller.id);

        if (updateErr) {
            console.error("Balance update error:", updateErr);
            return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            credit_balance: newBalance,
            package: pkg.name,
            credits_added: totalCredits,
        });
    } catch (error) {
        console.error("Purchase error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
