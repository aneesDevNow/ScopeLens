import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get reseller record
        const { data: reseller } = await supabase
            .from("resellers")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!reseller) {
            return NextResponse.json({ error: "Reseller profile not found" }, { status: 404 });
        }

        // Get transactions
        const { data: transactions, error } = await supabase
            .from("reseller_transactions")
            .select("*")
            .eq("reseller_id", reseller.id)
            .order("created_at", { ascending: false })
            .limit(100);

        if (error) {
            console.error("Error fetching transactions:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ transactions: transactions || [] });
    } catch (error) {
        console.error("Reseller transactions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
