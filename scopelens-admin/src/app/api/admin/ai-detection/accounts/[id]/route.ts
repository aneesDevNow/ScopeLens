import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PATCH - Update a ZeroGPT account
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
        if (body.bearer_token !== undefined) updates.bearer_token = body.bearer_token;
        if (body.is_active !== undefined) updates.is_active = body.is_active;
        if (body.max_concurrent !== undefined) updates.max_concurrent = body.max_concurrent;

        const { data: account, error } = await supabase
            .from("zerogpt_accounts")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ account });
    } catch (error) {
        console.error("Error updating account:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove a ZeroGPT account
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createAdminClient();

        const { error } = await supabase
            .from("zerogpt_accounts")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting account:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
