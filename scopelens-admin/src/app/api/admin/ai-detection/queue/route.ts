import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET - List queue items with stats
export async function GET(request: Request) {
    try {
        const supabase = createAdminClient();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") || "50");

        let query = supabase
            .from("scan_queue")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (status) {
            query = query.eq("status", status);
        }

        const { data: queue, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Look up account labels separately
        const accountIds = [...new Set((queue || []).map((q: { account_id: string | null }) => q.account_id).filter(Boolean))];
        let accountLabels: Record<string, string> = {};
        if (accountIds.length > 0) {
            const { data: accounts } = await supabase
                .from("zerogpt_accounts")
                .select("id, label")
                .in("id", accountIds);
            if (accounts) {
                accountLabels = Object.fromEntries(accounts.map((a: { id: string; label: string }) => [a.id, a.label]));
            }
        }

        // Merge account labels into queue items
        const enrichedQueue = (queue || []).map((item: { account_id: string | null;[key: string]: unknown }) => ({
            ...item,
            zerogpt_accounts: item.account_id ? { label: accountLabels[item.account_id] || "Unknown" } : null,
        }));

        // Get stats
        const { data: allItems } = await supabase
            .from("scan_queue")
            .select("status");

        const stats = {
            waiting: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            total: 0,
        };

        (allItems || []).forEach((item: { status: string }) => {
            stats.total++;
            if (item.status in stats) {
                stats[item.status as keyof typeof stats]++;
            }
        });

        return NextResponse.json({ queue: enrichedQueue, stats });
    } catch (error) {
        console.error("Error fetching queue:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Retry failed items or clear completed
export async function POST(request: Request) {
    try {
        const supabase = createAdminClient();
        const body = await request.json();

        if (body.action === "retry_failed") {
            const { error } = await supabase
                .from("scan_queue")
                .update({ status: "waiting", error: null, started_at: null, account_id: null })
                .eq("status", "failed");

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, message: "Failed items re-queued" });
        }

        if (body.action === "clear_completed") {
            const { error } = await supabase
                .from("scan_queue")
                .delete()
                .eq("status", "completed");

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, message: "Completed items cleared" });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("Error with queue action:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
