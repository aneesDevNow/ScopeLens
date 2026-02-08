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
            .select("*, zerogpt_accounts(label)")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (status) {
            query = query.eq("status", status);
        }

        const { data: queue, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

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

        return NextResponse.json({ queue: queue || [], stats });
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
