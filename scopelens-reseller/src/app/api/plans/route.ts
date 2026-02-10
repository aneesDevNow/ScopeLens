import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all active plans with reseller pricing
        const { data: plans, error } = await supabase
            .from("plans")
            .select("id, name, slug, price_monthly, price_yearly, reseller_price_monthly, reseller_price_yearly, reseller_discount_percent, scans_per_day, features, is_active")
            .eq("is_active", true)
            .order("price_monthly", { ascending: true });

        if (error) {
            console.error("Error fetching plans:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ plans: plans || [] });
    } catch (error) {
        console.error("Plans error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
