import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/keys/usage — Get usage logs for a specific key
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const keyId = searchParams.get("keyId");
        const days = parseInt(searchParams.get("days") || "7");

        // Get reseller record
        const { data: reseller } = await supabase
            .from("resellers")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!reseller) {
            return NextResponse.json({ error: "Not a reseller" }, { status: 403 });
        }

        // Verify key belongs to this reseller
        if (keyId) {
            const { data: key } = await supabase
                .from("api_keys")
                .select("id")
                .eq("id", keyId)
                .eq("reseller_id", reseller.id)
                .single();

            if (!key) {
                return NextResponse.json({ error: "Key not found" }, { status: 404 });
            }
        }

        const since = new Date();
        since.setDate(since.getDate() - days);

        // Build query
        let query = supabase
            .from("key_usage_logs")
            .select("id, endpoint, method, status_code, response_time_ms, ip_address, created_at")
            .gte("created_at", since.toISOString())
            .order("created_at", { ascending: false })
            .limit(100);

        if (keyId) {
            query = query.eq("api_key_id", keyId);
        } else {
            // Get all keys for this reseller and filter logs
            const { data: keys } = await supabase
                .from("api_keys")
                .select("id")
                .eq("reseller_id", reseller.id);

            if (keys && keys.length > 0) {
                query = query.in("api_key_id", keys.map(k => k.id));
            } else {
                return NextResponse.json({ logs: [], stats: { total: 0, success: 0, errors: 0, avgResponseTime: 0 } });
            }
        }

        const { data: logs, error: logsError } = await query;

        if (logsError) {
            return NextResponse.json({ error: logsError.message }, { status: 500 });
        }

        // Calculate stats
        const total = logs?.length || 0;
        const success = logs?.filter(l => l.status_code >= 200 && l.status_code < 400).length || 0;
        const errors = total - success;
        const avgResponseTime = total > 0
            ? Math.round((logs?.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) || 0) / total)
            : 0;

        return NextResponse.json({
            logs: logs || [],
            stats: { total, success, errors, avgResponseTime }
        });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
