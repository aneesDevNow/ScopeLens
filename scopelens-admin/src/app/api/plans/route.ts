import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
    try {
        const supabase = createAdminClient();

        const { data: plans, error } = await supabase
            .from("plans")
            .select("*")
            .order("price_monthly", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ plans });
    } catch (error) {
        console.error("Get plans error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createAdminClient();
        const body = await request.json();

        const { data, error } = await supabase
            .from("plans")
            .insert({
                name: body.name,
                slug: body.slug,
                price_monthly: body.price_monthly,
                price_yearly: body.price_yearly,
                reseller_price_monthly: body.reseller_price_monthly,
                reseller_price_yearly: body.reseller_price_yearly,
                reseller_discount_percent: body.reseller_discount_percent,
                scans_per_month: body.scans_per_month,
                features: body.features,
                is_active: body.is_active ?? true,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ plan: data }, { status: 201 });
    } catch (error) {
        console.error("Create plan error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
