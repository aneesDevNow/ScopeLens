import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Same packages as the frontend — keep in sync
const creditPackages = [
    { id: "pkg_25", amount: 25, bonus: 0, label: "Starter" },
    { id: "pkg_50", amount: 50, bonus: 5, label: "Basic" },
    { id: "pkg_100", amount: 100, bonus: 15, label: "Standard" },
    { id: "pkg_250", amount: 250, bonus: 50, label: "Pro" },
    { id: "pkg_500", amount: 500, bonus: 125, label: "Enterprise" },
];

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Auth check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse body
        const { packageId } = await request.json();
        if (!packageId) {
            return NextResponse.json({ error: "Missing packageId" }, { status: 400 });
        }

        // 3. Validate package
        const pkg = creditPackages.find(p => p.id === packageId);
        if (!pkg) {
            return NextResponse.json({ error: "Invalid package" }, { status: 400 });
        }

        const totalCredits = pkg.amount + pkg.bonus;

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
                description: `Purchased ${pkg.label} package: ${pkg.amount} credits${pkg.bonus > 0 ? ` + ${pkg.bonus} bonus` : ""}`,
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
            package: pkg.label,
            credits_added: totalCredits,
        });
    } catch (error) {
        console.error("Purchase error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
