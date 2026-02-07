import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: resellerId } = await params;

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { amount, note } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        // Get current reseller balance
        const { data: reseller, error: fetchError } = await supabase
            .from("reseller_profiles")
            .select("credit_balance, total_purchased")
            .eq("id", resellerId)
            .single();

        if (fetchError || !reseller) {
            return NextResponse.json({ error: "Reseller not found" }, { status: 404 });
        }

        const newBalance = reseller.credit_balance + amount;
        const newTotalPurchased = reseller.total_purchased + amount;

        // Update reseller balance
        const { error: updateError } = await supabase
            .from("reseller_profiles")
            .update({
                credit_balance: newBalance,
                total_purchased: newTotalPurchased,
                updated_at: new Date().toISOString(),
            })
            .eq("id", resellerId);

        if (updateError) {
            console.error("Error updating balance:", updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Create transaction record
        const { error: txError } = await supabase
            .from("reseller_transactions")
            .insert({
                reseller_id: resellerId,
                type: "credit_purchase",
                amount: amount,
                balance_after: newBalance,
                description: note || `Admin added $${amount} credits`,
                created_by: user.id,
            });

        if (txError) {
            console.error("Error creating transaction:", txError);
            // Don't fail the request, the balance was updated
        }

        return NextResponse.json({
            success: true,
            new_balance: newBalance,
        });
    } catch (error) {
        console.error("Add credits error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
