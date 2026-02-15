import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET - List all CORE API accounts
export async function GET() {
    try {
        const supabase = createAdminClient();

        const { data: accounts, error } = await supabase
            .from("core_api_accounts")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ accounts: accounts || [] });
    } catch (error) {
        console.error("Error fetching CORE API accounts:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new CORE API account
export async function POST(request: Request) {
    try {
        const supabase = createAdminClient();
        const body = await request.json();

        const { label, api_key, max_concurrent } = body;

        if (!api_key) {
            return NextResponse.json({ error: "API key is required" }, { status: 400 });
        }

        const { data: account, error } = await supabase
            .from("core_api_accounts")
            .insert({
                label: label || "CORE API Account",
                api_key,
                max_concurrent: max_concurrent || 5,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ account });
    } catch (error) {
        console.error("Error creating CORE API account:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
