import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET - List all ZeroGPT accounts
export async function GET() {
    try {
        const supabase = createAdminClient();

        const { data: accounts, error } = await supabase
            .from("zerogpt_accounts")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ accounts: accounts || [] });
    } catch (error) {
        console.error("Error fetching accounts:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new ZeroGPT account
export async function POST(request: Request) {
    try {
        const supabase = createAdminClient();
        const body = await request.json();

        const { label, bearer_token, max_concurrent } = body;

        if (!bearer_token) {
            return NextResponse.json({ error: "Bearer token is required" }, { status: 400 });
        }

        const { data: account, error } = await supabase
            .from("zerogpt_accounts")
            .insert({
                label: label || "Account",
                bearer_token,
                max_concurrent: max_concurrent || 2,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ account });
    } catch (error) {
        console.error("Error creating account:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
