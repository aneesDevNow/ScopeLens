import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get reseller profile
        const { data: resellerProfile, error } = await supabase
            .from("reseller_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (error || !resellerProfile) {
            return NextResponse.json({ error: "Reseller profile not found" }, { status: 404 });
        }

        // Get active clients count
        const { count: activeClients } = await supabase
            .from("reseller_clients")
            .select("*", { count: "exact", head: true })
            .eq("reseller_id", resellerProfile.id)
            .eq("status", "active");

        // Get this month's stats
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: monthTransactions } = await supabase
            .from("reseller_transactions")
            .select("amount, type")
            .eq("reseller_id", resellerProfile.id)
            .gte("created_at", startOfMonth.toISOString());

        const monthlySpent = (monthTransactions || [])
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const monthlyProfit = (monthTransactions || [])
            .filter(t => t.type === "client_activation" || t.type === "client_renewal")
            .reduce((sum, t) => {
                // Profit is calculated from reseller_clients, not transactions
                return sum;
            }, 0);

        return NextResponse.json({
            profile: resellerProfile,
            stats: {
                credit_balance: resellerProfile.credit_balance,
                active_clients: activeClients || 0,
                total_spent: resellerProfile.total_spent,
                commission_earned: resellerProfile.commission_earned,
                monthly_spent: monthlySpent,
            }
        });
    } catch (error) {
        console.error("Reseller profile error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
