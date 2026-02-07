import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/analytics - Get platform analytics
export async function GET() {
    try {
        const supabase = await createClient();

        // Verify admin access
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (adminProfile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get various counts
        const [
            usersResult,
            scansResult,
            activeSubsResult,
            recentScansResult,
        ] = await Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("scans").select("id", { count: "exact", head: true }),
            supabase
                .from("subscriptions")
                .select("id", { count: "exact", head: true })
                .eq("status", "active"),
            supabase
                .from("scans")
                .select("id, file_name, ai_score, created_at, user_id")
                .order("created_at", { ascending: false })
                .limit(10),
        ]);

        // Get today's new users
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: todayUsers } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .gte("created_at", today.toISOString());

        // Get this month's scans
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const { count: monthScans } = await supabase
            .from("scans")
            .select("id", { count: "exact", head: true })
            .gte("created_at", monthStart.toISOString());

        // Calculate average AI score
        const { data: scoresData } = await supabase
            .from("scans")
            .select("ai_score")
            .not("ai_score", "is", null)
            .limit(1000);

        const avgScore = scoresData && scoresData.length > 0
            ? Math.round(scoresData.reduce((sum, s) => sum + (s.ai_score || 0), 0) / scoresData.length)
            : 0;

        return NextResponse.json({
            overview: {
                totalUsers: usersResult.count || 0,
                totalScans: scansResult.count || 0,
                activeSubscriptions: activeSubsResult.count || 0,
                newUsersToday: todayUsers || 0,
                scansThisMonth: monthScans || 0,
                averageAiScore: avgScore,
            },
            recentScans: recentScansResult.data || [],
        });
    } catch (err) {
        console.error("Admin analytics API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
