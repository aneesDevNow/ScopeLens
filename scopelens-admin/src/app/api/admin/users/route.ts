import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const getAdminClient = () => {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

// GET /api/admin/users - List all users with profiles
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");
        const search = searchParams.get("search") || "";

        // Verify admin access
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const { data: adminProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (adminProfile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Use admin client to bypass RLS for fetching all users
        const admin = getAdminClient();

        // Fetch profiles (without join to avoid relationship issues)
        let query = admin
            .from("profiles")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (search) {
            const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&');
            query = query.or(`email.ilike.%${sanitizedSearch}%,first_name.ilike.%${sanitizedSearch}%,last_name.ilike.%${sanitizedSearch}%`);
        }

        const { data: profiles, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Batch-fetch subscriptions for these users
        const userIds = (profiles || []).map(p => p.id);
        let subsMap = new Map<string, { status: string; plan_name: string }>();

        if (userIds.length > 0) {
            const { data: subs } = await admin
                .from("subscriptions")
                .select("user_id, status, plan_id")
                .in("user_id", userIds);

            if (subs && subs.length > 0) {
                // Fetch plan names
                const planIds = [...new Set(subs.map(s => s.plan_id).filter(Boolean))];
                const { data: plans } = await admin
                    .from("plans")
                    .select("id, name")
                    .in("id", planIds);

                const planMap = new Map((plans || []).map(p => [p.id, p.name]));

                for (const sub of subs) {
                    if (sub.status === "active") {
                        subsMap.set(sub.user_id, {
                            status: sub.status,
                            plan_name: planMap.get(sub.plan_id) || "Unknown"
                        });
                    }
                }
            }
        }

        // Merge subscription info into profiles
        const users = (profiles || []).map(profile => ({
            ...profile,
            subscriptions: subsMap.has(profile.id)
                ? [{ status: subsMap.get(profile.id)!.status, plans: { name: subsMap.get(profile.id)!.plan_name } }]
                : []
        }));

        return NextResponse.json({ users, total: count });
    } catch (err) {
        console.error("Admin users API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
