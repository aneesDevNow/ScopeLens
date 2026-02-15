import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Ensure the system_settings table exists (auto-migration on first access)
async function ensureTable(supabase: ReturnType<typeof createAdminClient>) {
    const { error } = await supabase.from("system_settings").select("key").limit(1);
    if (error && error.code === "42P01") {
        // Table doesn't exist — create it
        // Using raw SQL via pg_net or rpc isn't available, so we create via Supabase SQL editor workaround
        // Instead we'll use a direct approach: insert will fail, admin must create table manually
        // Actually, let's try creating it through the postgres meta API
        console.warn("system_settings table does not exist. Please create it manually via SQL:");
        console.warn(`CREATE TABLE system_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT now());`);
        console.warn(`INSERT INTO system_settings (key, value) VALUES ('word_limit', '5000');`);
        return false;
    }
    return true;
}

// GET - Retrieve all system settings (or a specific key via ?key=...)
export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const key = request.nextUrl.searchParams.get("key");

        if (key) {
            const { data, error } = await supabase
                .from("system_settings")
                .select("*")
                .eq("key", key)
                .single();

            if (error) {
                // If table doesn't exist, return default
                if (error.code === "42P01" || error.code === "PGRST116") {
                    return NextResponse.json({ key, value: getDefault(key) });
                }
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json(data);
        }

        // Return all settings
        const { data, error } = await supabase
            .from("system_settings")
            .select("*")
            .order("key");

        if (error) {
            if (error.code === "42P01") {
                return NextResponse.json({ settings: [{ key: "word_limit", value: "5000" }] });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ settings: data });

    } catch (error) {
        console.error("System settings GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Update a system setting
export async function PATCH(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const body = await request.json();
        const { key, value } = body;

        if (!key || value === undefined || value === null) {
            return NextResponse.json({ error: "key and value are required" }, { status: 400 });
        }

        // Validate specific keys
        if (key === "word_limit") {
            const numValue = parseInt(value);
            if (isNaN(numValue) || numValue < 100 || numValue > 50000) {
                return NextResponse.json(
                    { error: "Word limit must be between 100 and 50,000" },
                    { status: 400 }
                );
            }
        }

        await ensureTable(supabase);

        // Upsert the setting
        const { data, error } = await supabase
            .from("system_settings")
            .upsert(
                { key, value: String(value), updated_at: new Date().toISOString() },
                { onConflict: "key" }
            )
            .select()
            .single();

        if (error) {
            console.error("System settings PATCH error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("System settings PATCH error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

function getDefault(key: string): string {
    const defaults: Record<string, string> = {
        word_limit: "5000",
    };
    return defaults[key] ?? "";
}
