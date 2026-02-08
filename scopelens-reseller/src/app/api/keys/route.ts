import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

// Generate a secure API key: sl_key_<32 random chars>
function generateApiKey(): string {
    return `sl_key_${crypto.randomBytes(24).toString("base64url")}`;
}

// Hash an API key for storage
function hashApiKey(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
}

// GET /api/keys — List all keys for the current reseller
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get reseller record
        const { data: reseller } = await supabase
            .from("resellers")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!reseller) {
            return NextResponse.json({ error: "Not a reseller" }, { status: 403 });
        }

        // Get all keys for this reseller
        const { data: keys, error: keysError } = await supabase
            .from("api_keys")
            .select("id, key_prefix, name, scopes, rate_limit_per_minute, rate_limit_per_day, is_active, last_used_at, expires_at, created_at")
            .eq("reseller_id", reseller.id)
            .order("created_at", { ascending: false });

        if (keysError) {
            return NextResponse.json({ error: keysError.message }, { status: 500 });
        }

        return NextResponse.json({ keys: keys || [] });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/keys — Create a new API key
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name = "Default Key" } = body;

        // Get reseller record
        const { data: reseller } = await supabase
            .from("resellers")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!reseller) {
            return NextResponse.json({ error: "Not a reseller" }, { status: 403 });
        }

        // Check existing key count (max 5 per reseller)
        const { count } = await supabase
            .from("api_keys")
            .select("id", { count: "exact", head: true })
            .eq("reseller_id", reseller.id);

        if ((count || 0) >= 5) {
            return NextResponse.json({
                error: "Maximum 5 API keys allowed per reseller"
            }, { status: 400 });
        }

        // Generate and hash the key
        const rawKey = generateApiKey();
        const keyHash = hashApiKey(rawKey);
        const keyPrefix = rawKey.substring(0, 12); // sl_key_XXXX for display

        // Store the hashed key
        const { data: newKey, error: createError } = await supabase
            .from("api_keys")
            .insert({
                reseller_id: reseller.id,
                key_hash: keyHash,
                key_prefix: keyPrefix,
                name,
                scopes: ["scan:create", "scan:read"],
                rate_limit_per_minute: 60,
                rate_limit_per_day: 1000,
            })
            .select("id, key_prefix, name, scopes, rate_limit_per_minute, rate_limit_per_day, is_active, created_at")
            .single();

        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        // Return the raw key ONLY on creation (never stored in plain text)
        return NextResponse.json({
            key: newKey,
            secret: rawKey,
            message: "Save this key now — you won't be able to see it again!"
        }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/keys — Revoke an API key
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const keyId = searchParams.get("id");
        if (!keyId) {
            return NextResponse.json({ error: "Missing key ID" }, { status: 400 });
        }

        // Get reseller record
        const { data: reseller } = await supabase
            .from("resellers")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!reseller) {
            return NextResponse.json({ error: "Not a reseller" }, { status: 403 });
        }

        // Soft-delete: deactivate the key
        const { error: updateError } = await supabase
            .from("api_keys")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("id", keyId)
            .eq("reseller_id", reseller.id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Key revoked successfully" });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
