import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function verifyAdmin(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") return null;
    return user;
}

// GET - Fetch current site logo
export async function GET() {
    try {
        const supabase = await createClient();
        const user = await verifyAdmin(supabase);
        if (!user) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data: setting } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "report_logo")
            .single();

        if (!setting?.value) {
            return NextResponse.json({ logoUrl: null, isDefault: true });
        }

        const { data: urlData } = await supabase.storage
            .from("report-logos")
            .createSignedUrl(setting.value, 3600);

        return NextResponse.json({
            logoUrl: urlData?.signedUrl || null,
            isDefault: false,
            path: setting.value,
        });
    } catch (err) {
        console.error("Admin logo GET error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Upload new site logo
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const user = await verifyAdmin(supabase);
        if (!user) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get("logo") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Use PNG, JPG, SVG, or WebP." }, { status: 400 });
        }
        if (file.size > 500 * 1024) {
            return NextResponse.json({ error: "File too large. Max 500KB." }, { status: 400 });
        }

        // Delete old logo if exists
        const { data: oldSetting } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "report_logo")
            .single();

        if (oldSetting?.value) {
            await supabase.storage.from("report-logos").remove([oldSetting.value]);
        }

        // Upload new logo
        const ext = file.name.split(".").pop() || "png";
        const path = `site/report_logo.${ext}`;
        const buffer = await file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
            .from("report-logos")
            .upload(path, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 });
        }

        // Update site settings
        await supabase
            .from("site_settings")
            .upsert({ key: "report_logo", value: path, updated_at: new Date().toISOString() });

        const { data: urlData } = await supabase.storage
            .from("report-logos")
            .createSignedUrl(path, 3600);

        return NextResponse.json({
            logoUrl: urlData?.signedUrl || null,
            isDefault: false,
        });
    } catch (err) {
        console.error("Admin logo upload error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Reset to default logo
export async function DELETE() {
    try {
        const supabase = await createClient();
        const user = await verifyAdmin(supabase);
        if (!user) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data: setting } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "report_logo")
            .single();

        if (setting?.value) {
            await supabase.storage.from("report-logos").remove([setting.value]);
        }

        await supabase
            .from("site_settings")
            .upsert({ key: "report_logo", value: null, updated_at: new Date().toISOString() });

        return NextResponse.json({ logoUrl: null, isDefault: true });
    } catch (err) {
        console.error("Admin logo delete error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
