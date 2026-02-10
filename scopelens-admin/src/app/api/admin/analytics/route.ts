import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js"; // fallback if getAdminClient not avail, but let's check context

// Helper to get admin client
const getAdminClient = () => {
    return createAdminClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

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

        // Use admin client for all counts to bypass RLS
        const admin = getAdminClient();

        const [
            usersResult,
            scansResult,
            activeSubsResult,
            recentScansResult,
            resellersResult,
            revenueResult,
            claimedKeysResult
        ] = await Promise.all([
            admin.from("profiles").select("id", { count: "exact", head: true }),
            admin.from("scans").select("id", { count: "exact", head: true }),
            admin
                .from("subscriptions")
                .select("id", { count: "exact", head: true })
                .eq("status", "active"),
            admin
                .from("scans")
                .select("id, file_name, ai_score, created_at, user_id")
                .order("created_at", { ascending: false })
                .limit(10),
            admin.from("resellers").select("id", { count: "exact", head: true }),
            admin.from("reseller_transactions")
                .select("amount, created_at")
                .eq("type", "credit_purchase"),
            admin.from("license_keys")
                .select("id", { count: "exact", head: true })
                .eq("status", "claimed")
        ]);

        // Get today's new users
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: todayUsers } = await admin
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .gte("created_at", today.toISOString());

        // Get this month's scans
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const { count: monthScans } = await admin
            .from("scans")
            .select("id", { count: "exact", head: true })
            .gte("created_at", monthStart.toISOString());

        // Calculate Monthly Revenue from Reseller Transactions
        const monthlyRevenue = (revenueResult.data || [])
            .filter(tx => new Date(tx.created_at) >= monthStart)
            .reduce((sum, tx) => sum + (tx.amount || 0), 0);

        // Calculate average AI score
        const { data: scoresData } = await admin
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
                activeResellers: resellersResult.count || 0,
                monthlyRevenue: monthlyRevenue,
                claimedKeys: claimedKeysResult.count || 0
            },
            recentScans: recentScansResult.data || [],
        });
    } catch (err) {
        console.error("Admin analytics API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
