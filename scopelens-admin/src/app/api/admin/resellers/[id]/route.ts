import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
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
        const { is_active, company_name } = body;

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (typeof is_active === "boolean") updates.is_active = is_active;
        if (company_name !== undefined) updates.company_name = company_name;

        const { error } = await supabase
            .from("reseller_profiles")
            .update(updates)
            .eq("id", resellerId);

        if (error) {
            console.error("Error updating reseller:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update reseller error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
