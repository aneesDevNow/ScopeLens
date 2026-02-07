import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { scanId } = await request.json();

        if (!scanId) {
            return NextResponse.json({ error: "Scan ID required" }, { status: 400 });
        }

        // Get scan data
        const { data: scan, error: scanError } = await supabase
            .from("scans")
            .select("*")
            .eq("id", scanId)
            .eq("user_id", user.id)
            .single();

        if (scanError || !scan) {
            return NextResponse.json({ error: "Scan not found" }, { status: 404 });
        }

        // Check if report already exists
        if (scan.report_path) {
            const { data: signedUrl } = await supabase.storage
                .from("reports")
                .createSignedUrl(scan.report_path, 3600); // 1 hour expiry

            return NextResponse.json({
                success: true,
                reportUrl: signedUrl?.signedUrl,
                cached: true
            });
        }

        // Generate PDF report
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(37, 99, 235); // Blue
        doc.rect(0, 0, pageWidth, 40, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("ScopeLens", 20, 25);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("AI Detection Report", 20, 35);

        // Reset text color
        doc.setTextColor(0, 0, 0);

        // File Info Section
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Document Information", 20, 55);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`File Name: ${scan.file_name}`, 20, 65);
        doc.text(`File Size: ${formatFileSize(scan.file_size || 0)}`, 20, 73);
        doc.text(`File Type: ${scan.file_type || "Unknown"}`, 20, 81);
        doc.text(`Scanned: ${new Date(scan.created_at).toLocaleString()}`, 20, 89);

        // AI Score Section
        doc.setFillColor(245, 245, 245);
        doc.rect(15, 100, pageWidth - 30, 50, "F");

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("AI Detection Result", 20, 115);

        // Score with color
        const score = scan.ai_score || 0;
        if (score > 50) {
            doc.setTextColor(220, 38, 38); // Red
        } else if (score > 20) {
            doc.setTextColor(234, 179, 8); // Yellow
        } else {
            doc.setTextColor(22, 163, 74); // Green
        }

        doc.setFontSize(36);
        doc.setFont("helvetica", "bold");
        doc.text(`${score}%`, 20, 140);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        const scoreText = score < 20
            ? "Low probability of AI-generated content"
            : score < 50
                ? "Moderate probability of AI-generated content"
                : "High probability of AI-generated content";
        doc.text(scoreText, 70, 135);

        // Analysis Summary
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Analysis Summary", 20, 170);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        const summaryLines = [
            `Word Count: ${scan.word_count || "N/A"}`,
            `Paragraph Count: ${scan.paragraph_count || "N/A"}`,
            `Status: ${scan.status || "Unknown"}`,
            `Completed: ${scan.completed_at ? new Date(scan.completed_at).toLocaleString() : "N/A"}`
        ];

        let y = 180;
        summaryLines.forEach(line => {
            doc.text(line, 20, y);
            y += 8;
        });

        // Disclaimer
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text("This report is generated automatically by ScopeLens AI Detection Platform.", 20, 250);
        doc.text("Results are indicative and should be reviewed by a human for final assessment.", 20, 258);
        doc.text(`Report ID: ${scan.id}`, 20, 270);
        doc.text(`Generated: ${new Date().toISOString()}`, 20, 278);

        // Convert to buffer
        const pdfBuffer = doc.output("arraybuffer");

        // Upload to Supabase Storage
        const reportPath = `${user.id}/${scan.id}_report.pdf`;
        const { error: uploadError } = await supabase.storage
            .from("reports")
            .upload(reportPath, pdfBuffer, {
                contentType: "application/pdf",
                upsert: true
            });

        if (uploadError) {
            console.error("Report upload error:", uploadError);
            return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
        }

        // Update scan with report path
        await supabase
            .from("scans")
            .update({ report_path: reportPath })
            .eq("id", scanId);

        // Get signed URL
        const { data: signedUrl } = await supabase.storage
            .from("reports")
            .createSignedUrl(reportPath, 3600);

        return NextResponse.json({
            success: true,
            reportUrl: signedUrl?.signedUrl,
            cached: false
        });

    } catch (error) {
        console.error("Report generation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
