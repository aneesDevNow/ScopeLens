import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET - List plagiarism queue items with stats
export async function GET() {
    try {
        const supabase = createAdminClient();

        const { data: queue, error } = await supabase
            .from("plagiarism_queue")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Calculate stats
        const items = queue || [];
        const stats = {
            waiting: items.filter((i) => i.status === "waiting").length,
            processing: items.filter((i) => i.status === "processing").length,
            completed: items.filter((i) => i.status === "completed").length,
            failed: items.filter((i) => i.status === "failed").length,
            total: items.length,
        };

        return NextResponse.json({ queue: items, stats });
    } catch (error) {
        console.error("Error fetching plagiarism queue:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Queue actions (retry_failed, clear_completed)
export async function POST(request: Request) {
    try {
        const supabase = createAdminClient();
        const body = await request.json();
        const { action } = body;

        if (action === "retry_failed") {
            const { error } = await supabase
                .from("plagiarism_queue")
                .update({ status: "waiting", error: null, started_at: null })
                .eq("status", "failed");

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, message: "Failed items reset to waiting" });
        }

        if (action === "clear_completed") {
            const { error } = await supabase
                .from("plagiarism_queue")
                .delete()
                .eq("status", "completed");

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, message: "Completed items cleared" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Error processing plagiarism queue action:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
