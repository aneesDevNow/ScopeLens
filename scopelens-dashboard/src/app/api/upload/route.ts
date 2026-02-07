import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Only PDF, DOCX, and TXT files are allowed." }, { status: 400 });
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
        }

        // Create unique file path: user_id/timestamp_filename
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${user.id}/${timestamp}_${sanitizedName}`;

        // Upload to Supabase Storage
        const arrayBuffer = await file.arrayBuffer();
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("documents")
            .upload(filePath, arrayBuffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
        }

        // Create scan record in database
        const { data: scan, error: scanError } = await supabase
            .from("scans")
            .insert({
                user_id: user.id,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                file_path: uploadData.path,
                status: "pending",
                ai_score: null
            })
            .select()
            .single();

        if (scanError) {
            console.error("Scan record error:", scanError);
            // Try to delete the uploaded file if DB insert fails
            await supabase.storage.from("documents").remove([filePath]);
            return NextResponse.json({ error: "Failed to create scan record", details: scanError.message }, { status: 500 });
        }

        // Simulate AI processing (in production, this would trigger a background job)
        // For now, we'll update the status to "processing" and set a random score after a delay
        setTimeout(async () => {
            const simulatedScore = Math.floor(Math.random() * 100);
            await supabase
                .from("scans")
                .update({
                    status: "completed",
                    ai_score: simulatedScore,
                    completed_at: new Date().toISOString()
                })
                .eq("id", scan.id);
        }, 3000);

        return NextResponse.json({
            success: true,
            scan: {
                id: scan.id,
                file_name: scan.file_name,
                file_path: scan.file_path,
                status: scan.status
            }
        });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
