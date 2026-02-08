import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Auth & Admin check
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
        }

        // 2. Fetch packages
        const { data, error } = await supabase
            .from("credit_packages")
            .select("*")
            .order("sort_order", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ packages: data });
    } catch (err) {
        console.error("Error fetching credit packages:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
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
            return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
        }

        const body = await req.json();

        // Basic validation
        if (!body.name || !body.credits || !body.price) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("credit_packages")
            .insert({
                name: body.name,
                credits: body.credits,
                bonus_credits: body.bonus_credits || 0,
                price: body.price,
                is_popular: body.is_popular || false,
                is_active: body.is_active !== false,
                sort_order: body.sort_order || 0
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ package: data });
    } catch (err) {
        console.error("Error creating credit package:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
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
            return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
        }

        const body = await req.json();
        if (!body.id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("credit_packages")
            .update({
                name: body.name,
                credits: body.credits,
                bonus_credits: body.bonus_credits,
                price: body.price,
                is_popular: body.is_popular,
                is_active: body.is_active,
                sort_order: body.sort_order,
                updated_at: new Date().toISOString()
            })
            .eq("id", body.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ package: data });
    } catch (err) {
        console.error("Error updating credit package:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
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
            return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const { error } = await supabase
            .from("credit_packages")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Error deleting credit package:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
