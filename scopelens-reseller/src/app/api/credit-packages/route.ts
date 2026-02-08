import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // No auth REQUIRED to list packages (so users can see them before logging in maybe, 
        // but this is reseller portal, so they should be logged in). 
        // But for simplicity, we can strict it or not. 
        // The RLS policy "credit_packages_read_all" allows everyone to read.

        const { data, error } = await supabase
            .from("credit_packages")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ packages: data });
    } catch (err) {
        console.error("Error fetching credit packages:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
