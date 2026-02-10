import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/plans - List all plans
export async function GET() {
    try {
        const supabase = await createClient();

        // Verify admin access
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (adminProfile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data: plans, error } = await supabase
            .from("plans")
            .select("*")
            .order("price_monthly", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ plans });
    } catch (err) {
        console.error("Admin plans API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/admin/plans - Create new plan
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Verify admin access
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (adminProfile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data: plan, error } = await supabase
            .from("plans")
            .insert({
                name: body.name,
                slug: body.slug,
                price_monthly: body.priceMonthly,
                price_yearly: body.priceYearly,
                scans_per_day: body.scansPerDay,
                features: body.features || [],
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ plan }, { status: 201 });
    } catch (err) {
        console.error("Admin create plan API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
