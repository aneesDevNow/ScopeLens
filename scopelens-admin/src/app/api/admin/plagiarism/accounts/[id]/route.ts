import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PATCH - Update a CORE API account
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createAdminClient();
        const body = await request.json();

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (body.label !== undefined) updates.label = body.label;
        if (body.api_key !== undefined) updates.api_key = body.api_key;
        if (body.is_active !== undefined) updates.is_active = body.is_active;
        if (body.max_concurrent !== undefined) updates.max_concurrent = body.max_concurrent;

        const { data: account, error } = await supabase
            .from("core_api_accounts")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ account });
    } catch (error) {
        console.error("Error updating CORE API account:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove a CORE API account
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createAdminClient();

        const { error } = await supabase
            .from("core_api_accounts")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting CORE API account:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
