import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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

        // Fetch transactions for this reseller
        const { data: transactions, error } = await supabase
            .from("reseller_transactions")
            .select("*")
            .eq("reseller_id", resellerId)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching transactions:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ transactions: transactions || [] });
    } catch (error) {
        console.error("Transactions API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
