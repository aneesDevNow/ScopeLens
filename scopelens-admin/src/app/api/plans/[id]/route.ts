import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createAdminClient();
        const { id } = await params;
        const body = await request.json();

        const { data, error } = await supabase
            .from("plans")
            .update({
                name: body.name,
                slug: body.slug,
                price_monthly: body.price_monthly,
                price_yearly: body.price_yearly,
                reseller_price_monthly: body.reseller_price_monthly,
                reseller_price_yearly: body.reseller_price_yearly,
                reseller_discount_percent: body.reseller_discount_percent,
                scans_per_month: body.scans_per_month,
                features: body.features,
                is_active: body.is_active,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ plan: data });
    } catch (error) {
        console.error("Update plan error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createAdminClient();
        const { id } = await params;

        const { error } = await supabase
            .from("plans")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete plan error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
