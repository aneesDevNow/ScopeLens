import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch all resellers with their profiles and client counts
        const { data: resellers, error } = await supabase
            .from("reseller_profiles")
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    email
                )
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching resellers:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get client counts for each reseller
        const resellersWithCounts = await Promise.all(
            (resellers || []).map(async (reseller) => {
                const { count } = await supabase
                    .from("reseller_clients")
                    .select("*", { count: "exact", head: true })
                    .eq("reseller_id", reseller.id)
                    .eq("status", "active");

                return { ...reseller, client_count: count || 0 };
            })
        );

        return NextResponse.json({ resellers: resellersWithCounts });
    } catch (error) {
        console.error("Resellers API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { user_id, company_name } = body;

        // Create reseller profile
        const { data: reseller, error } = await supabase
            .from("reseller_profiles")
            .insert({
                user_id,
                company_name,
                credit_balance: 0,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating reseller:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ reseller }, { status: 201 });
    } catch (error) {
        console.error("Create reseller error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
