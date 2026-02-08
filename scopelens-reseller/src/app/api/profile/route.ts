import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get reseller from the correct 'resellers' table
        const { data: reseller, error } = await supabase
            .from("resellers")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (error || !reseller) {
            return NextResponse.json({ error: "Reseller profile not found" }, { status: 404 });
        }

        // Get key stats
        const { count: totalKeys } = await supabase
            .from("license_keys")
            .select("*", { count: "exact", head: true })
            .eq("reseller_id", reseller.id);

        const { count: availableKeys } = await supabase
            .from("license_keys")
            .select("*", { count: "exact", head: true })
            .eq("reseller_id", reseller.id)
            .eq("status", "available");

        const { count: claimedKeys } = await supabase
            .from("license_keys")
            .select("*", { count: "exact", head: true })
            .eq("reseller_id", reseller.id)
            .eq("status", "claimed");

        return NextResponse.json({
            reseller,
            stats: {
                credit_balance: reseller.credit_balance,
                total_keys: totalKeys || 0,
                available_keys: availableKeys || 0,
                claimed_keys: claimedKeys || 0,
            }
        });
    } catch (error) {
        console.error("Reseller profile error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
