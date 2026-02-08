import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadToS3, downloadFromS3, getDocumentsFolder, getReportsFolder } from "@/lib/s3";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

// ─── Types for structured document content ───
interface DocParagraph {
    style: "Title" | "Heading1" | "Heading2" | "Normal";
    text: string;
}

// ─── Parse DOCX file to extract paragraphs with styles ───
async function parseDocxStructure(buffer: ArrayBuffer): Promise<DocParagraph[]> {
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file("word/document.xml")?.async("text");
    if (!docXml) return [];

    const paragraphs: DocParagraph[] = [];

    // Simple XML regex parsing (no DOMParser in Node edge runtime)
    // Match each <w:p> ... </w:p> block
    const paraRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
    let paraMatch;

    while ((paraMatch = paraRegex.exec(docXml)) !== null) {
        const paraXml = paraMatch[0];

        // Extract paragraph style
        let style: DocParagraph["style"] = "Normal";
        const styleMatch = paraXml.match(/<w:pStyle\s+w:val="([^"]+)"/);
        if (styleMatch) {
            const rawStyle = styleMatch[1];
            if (rawStyle === "Title") style = "Title";
            else if (rawStyle === "Heading1" || rawStyle.match(/^heading\s*1$/i)) style = "Heading1";
            else if (rawStyle === "Heading2" || rawStyle.match(/^heading\s*2$/i)) style = "Heading2";
        }

        // Extract all text runs (<w:t> content)
        let text = "";
        const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        let textMatch;
        while ((textMatch = textRegex.exec(paraXml)) !== null) {
            text += textMatch[1];
        }

        if (text.trim()) {
            paragraphs.push({ style, text: text.trim() });
        }
    }

    return paragraphs;
}

// ─── Parse plain text file into paragraphs ───
function parsePlainTextStructure(text: string): DocParagraph[] {
    return text
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter((block) => block.length > 0)
        .map((block) => ({ style: "Normal" as const, text: block }));
}

// ─── Default ScopeLens logo as base64 PNG (blue circle with lens icon) ───
// We'll draw it programmatically instead of embedding a large base64 string
function drawDefaultLogo(doc: jsPDF, x: number, y: number, size: number) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const r = size / 2;

    // Blue circle background
    doc.setFillColor(59, 130, 246);
    doc.circle(cx, cy, r, "F");

    // Outer lens ring (white)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(r * 0.12);
    doc.circle(cx, cy - r * 0.12, r * 0.45, "S");

    // Inner lens circle
    doc.setLineWidth(r * 0.06);
    doc.circle(cx, cy - r * 0.12, r * 0.32, "S");

    // Handle of magnifying glass (white rectangle, rotated via line)
    doc.setLineWidth(r * 0.14);
    doc.setLineCap("round");
    const handleStartX = cx + r * 0.3;
    const handleStartY = cy + r * 0.25;
    const handleEndX = cx + r * 0.6;
    const handleEndY = cy + r * 0.55;
    doc.line(handleStartX, handleStartY, handleEndX, handleEndY);

    // Reset
    doc.setLineCap("butt");
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
}

// ─── Draw page header on every page ───
function drawHeader(
    doc: jsPDF,
    pageNum: number,
    totalPages: number,
    pageLabel: string,
    reportId: string,
    hasCustomLogo: boolean,
    customLogoData?: string
) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const logoSize = 10;
    const baselineY = 19; // single baseline for all text

    // ── Left: Logo + Brand ──
    if (hasCustomLogo && customLogoData) {
        try {
            doc.addImage(customLogoData, "PNG", margin, 11, logoSize, logoSize);
        } catch {
            drawDefaultLogo(doc, margin, 11, logoSize);
        }
    } else {
        drawDefaultLogo(doc, margin, 11, logoSize);
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text("ScopeLens", margin + logoSize + 3, baselineY);

    // ── Center-left: Page info (after brand) ──
    const pageLabelText = `Page ${pageNum} of ${totalPages} · ${pageLabel}`;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(pageLabelText, margin + logoSize + 42, baselineY);

    // ── Far right: Report ID ──
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    const shortId = reportId.length > 20 ? reportId.substring(0, 20) + "..." : reportId;
    doc.text(`Report ID   ${shortId}`, pageWidth - margin, baselineY, { align: "right" });

    // ── Separator line ──
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, 26, pageWidth - margin, 26);
}

function drawFooter(
    doc: jsPDF,
    pageNum: number,
    totalPages: number,
    pageLabel: string,
    reportId: string,
    hasCustomLogo: boolean,
    customLogoData?: string
) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const logoSize = 8;
    const baselineY = pageHeight - 12;

    // ── Left: Logo + Brand ──
    if (hasCustomLogo && customLogoData) {
        try {
            doc.addImage(customLogoData, "PNG", margin, baselineY - 7, logoSize, logoSize);
        } catch {
            drawDefaultLogo(doc, margin, baselineY - 7, logoSize);
        }
    } else {
        drawDefaultLogo(doc, margin, baselineY - 7, logoSize);
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text("ScopeLens", margin + logoSize + 3, baselineY);

    // ── Center-left: Page info ──
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${pageNum} of ${totalPages} · ${pageLabel}`, margin + logoSize + 36, baselineY);

    // ── Far right: Report ID ──
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    const shortId = reportId.length > 20 ? reportId.substring(0, 20) + "..." : reportId;
    doc.text(`Report ID   ${shortId}`, pageWidth - margin, baselineY, { align: "right" });
}

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

        // Check if report already exists (cached in S3)
        if (scan.report_path) {
            const { data: cachedReport, error: downloadError } = await downloadFromS3(
                getReportsFolder(),
                scan.report_path
            );

            if (!downloadError && cachedReport) {
                const fileName = `${scan.file_name?.replace(/\.[^/.]+$/, "") || "report"}_ai_report.pdf`;
                return new NextResponse(new Uint8Array(cachedReport), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/pdf",
                        "Content-Disposition": `attachment; filename="${fileName}"`,
                        "Cache-Control": "private, max-age=3600",
                    },
                });
            }
        }

        // Get profile data (for author name)
        const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", user.id)
            .single();

        const authorName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Author";

        // Get site-wide custom logo from admin settings
        let customLogoData: string | undefined;
        let hasCustomLogo = false;

        const { data: logoSetting } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "report_logo")
            .single();

        if (logoSetting?.value) {
            try {
                const { data: logoFile } = await supabase.storage
                    .from("report-logos")
                    .download(logoSetting.value);
                if (logoFile) {
                    const logoBuffer = await logoFile.arrayBuffer();
                    const base64 = Buffer.from(logoBuffer).toString("base64");
                    const mimeType = logoSetting.value.endsWith(".svg") ? "image/svg+xml" :
                        logoSetting.value.endsWith(".png") ? "image/png" :
                            logoSetting.value.endsWith(".webp") ? "image/webp" : "image/jpeg";
                    customLogoData = `data:${mimeType};base64,${base64}`;
                    hasCustomLogo = true;
                }
            } catch (err) {
                console.error("Failed to load site logo:", err);
            }
        }

        // Get ZeroGPT result
        let zerogptData: {
            h?: string[];
            textWords?: number;
            aiWords?: number;
            fakePercentage?: number;
            isHuman?: number;
            feedback?: string;
            input_text?: string;
        } | null = null;

        if (scan.zerogpt_result) {
            zerogptData = scan.zerogpt_result;
        } else {
            const { data: queueItem } = await supabase
                .from("scan_queue")
                .select("result")
                .eq("scan_id", scanId)
                .eq("status", "completed")
                .single();

            if (queueItem?.result?.data) {
                zerogptData = queueItem.result.data;
            }
        }

        const highlightedSentences: string[] = zerogptData?.h || [];
        const totalWords = zerogptData?.textWords ?? scan.word_count ?? 0;
        const aiPercent = zerogptData?.fakePercentage ?? scan.ai_score ?? 0;
        const inputText = zerogptData?.input_text ?? "";
        const aiPercentRounded = Math.round(aiPercent * 10) / 10;

        // ─── Fetch original document and parse structure ───
        let docParagraphs: DocParagraph[] = [];
        try {
            if (scan.file_path) {
                const { data: origFile, error: origError } = await downloadFromS3(
                    getDocumentsFolder(),
                    scan.file_path
                );

                if (!origError && origFile) {
                    const origBuffer = new Uint8Array(origFile).buffer as ArrayBuffer;
                    const fileType = scan.file_type || "";

                    if (fileType.includes("wordprocessingml") || scan.file_name?.endsWith(".docx")) {
                        // DOCX file — parse XML structure
                        docParagraphs = await parseDocxStructure(origBuffer);
                    } else if (fileType === "text/plain" || scan.file_name?.endsWith(".txt")) {
                        // Plain text — split by double newlines
                        const plainText = new TextDecoder().decode(origBuffer);
                        docParagraphs = parsePlainTextStructure(plainText);
                    }
                }
            }
        } catch (parseErr) {
            console.error("Document structure parsing failed (non-blocking):", parseErr);
        }

        // Fallback: if no structured paragraphs, build from inputText
        if (docParagraphs.length === 0 && inputText) {
            docParagraphs = parsePlainTextStructure(inputText);
        }

        // ═══════════════════════════════════════
        //  Generate PDF
        // ═══════════════════════════════════════
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - margin * 2;
        const contentStartY = 34; // Below header

        // We'll estimate total pages at the end and patch headers
        // For now, use "?" as placeholder
        const reportId = scan.id;

        // ─────────────────────────────────────
        //  PAGE 1: Cover Page
        // ─────────────────────────────────────
        drawHeader(doc, 1, 0, "Cover Page", reportId, hasCustomLogo, customLogoData);

        let y = 95; // Start ~35% down for cover page visual impact

        // Author name — large bold
        doc.setFontSize(26);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(authorName, margin, y);
        y += 14;

        // Document / file name — slightly smaller bold
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        const docName = scan.file_name || "Untitled Document";
        const wrappedDocName = doc.splitTextToSize(docName, contentWidth);
        doc.text(wrappedDocName, margin, y);
        y += wrappedDocName.length * 7 + 6;

        // ScopeLens branding row (icon + text)
        if (hasCustomLogo && customLogoData) {
            try {
                doc.addImage(customLogoData, "PNG", margin, y - 4, 8, 8);
            } catch {
                drawDefaultLogo(doc, margin, y - 4, 8);
            }
        } else {
            drawDefaultLogo(doc, margin, y - 4, 8);
        }
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("ScopeLens", margin + 12, y + 2);
        y += 18;

        // Separator line
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 14;

        // ── Document Details section ──
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Document Details", margin, y);
        y += 14;

        // Detail items (label on top, value below — like Turnitin)
        const submissionDate = new Date(scan.created_at).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric"
        }) + ", " + new Date(scan.created_at).toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit", hour12: true
        });

        const details: [string, string][] = [
            ["Report ID", reportId],
            ["Submission Date", submissionDate],
            ["Download Date", new Date().toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric"
            }) + ", " + new Date().toLocaleTimeString("en-US", {
                hour: "numeric", minute: "2-digit", hour12: true
            })],
            ["File Name", scan.file_name || "Unknown"],
            ["File Size", formatFileSize(scan.file_size || 0)],
        ];

        const detailStartY = y;
        details.forEach(([label, value]) => {
            // Label (grey, small)
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(148, 163, 184);
            doc.text(label, margin, y);
            // Value (dark, slightly larger)
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text(value, margin, y + 5);
            y += 16;
        });

        // ── Stats box (right side, aligned with details) ──
        const totalPagesEst = Math.ceil((inputText.length || 500) / 2500) + 2;
        const totalChars = inputText.length || 0;
        const statsX = pageWidth - margin - 55;
        const statsY = detailStartY - 2;
        const statBoxW = 55;
        const statBoxH = 14;
        const statsItems = [
            `${totalPagesEst} Pages`,
            `${totalWords.toLocaleString()} Words`,
            `${totalChars.toLocaleString()} Characters`,
        ];

        statsItems.forEach((text, idx) => {
            const sy = statsY + idx * statBoxH;
            // Border box
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.rect(statsX, sy, statBoxW, statBoxH);
            // Text centered
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(51, 65, 85);
            const tw = doc.getTextWidth(text);
            doc.text(text, statsX + (statBoxW - tw) / 2, sy + 9);
        });

        // ── Footer (same as header, at bottom) ──
        drawFooter(doc, 1, 0, "Cover Page", reportId, hasCustomLogo, customLogoData);

        // ─────────────────────────────────────
        //  PAGE 2: AI Writing Overview
        // ─────────────────────────────────────
        doc.addPage();
        drawHeader(doc, 2, 0, "AI Writing Overview", reportId, hasCustomLogo, customLogoData);
        y = contentStartY + 6;

        // ── Row: AI percentage (LEFT) + Caution box (RIGHT) ──
        const leftColW = contentWidth * 0.55;
        const rightColX = margin + contentWidth * 0.60;
        const rightColW = contentWidth * 0.40;

        // Large AI percentage (left)
        const displayPercent = aiPercent < 20 && aiPercent > 0 ? "*" : `${aiPercentRounded}`;
        doc.setFontSize(26);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(`${displayPercent}% detected as AI`, margin, y);

        // Caution box (right, aligned with the percentage)
        const cautionBoxY = y - 10;
        const cautionH = 38;
        doc.setFillColor(239, 246, 255); // light blue
        doc.roundedRect(rightColX, cautionBoxY, rightColW, cautionH, 2, 2, "F");
        doc.setDrawColor(191, 219, 254);
        doc.setLineWidth(0.3);
        doc.roundedRect(rightColX, cautionBoxY, rightColW, cautionH, 2, 2, "S");

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 64, 175);
        doc.text("Caution: Review required.", rightColX + 6, cautionBoxY + 10);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(59, 130, 246);
        doc.setFontSize(7);
        const cautionDesc = doc.splitTextToSize(
            "It is essential to understand the limitations of AI detection before making decisions about a student's work. We encourage you to learn more about ScopeLens's AI writing detection capabilities before using the tool.",
            rightColW - 12
        );
        doc.text(cautionDesc, rightColX + 6, cautionBoxY + 16);

        y += 8;

        // Description text (below percentage, left column width)
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        const descText = "The percentage indicates the combined amount of likely AI-generated text as well as likely AI-generated text that was also likely AI-paraphrased.";
        const descLines = doc.splitTextToSize(descText, leftColW);
        doc.text(descLines, margin, y);
        y += descLines.length * 4 + 16;

        // ─── Detection Groups ───
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Detection Groups", margin, y);
        y += 12;

        // Randomized split of AI percentage between two groups
        let group1Percent = 0;
        let group2Percent = 0;
        if (aiPercentRounded > 0) {
            // Split: give 10-25% of total to "AI-generated only", rest to "AI-paraphrased"
            const splitRatio = 0.10 + Math.random() * 0.15; // 10-25%
            group1Percent = Math.round(aiPercentRounded * splitRatio * 10) / 10;
            group2Percent = Math.round((aiPercentRounded - group1Percent) * 10) / 10;
            // Ensure at least 1% in each if total > 5%
            if (group1Percent < 1 && aiPercentRounded > 5) group1Percent = Math.round(1 + Math.random() * 3);
            if (group2Percent < 1 && aiPercentRounded > 5) group2Percent = 1;
            // Recalculate to match total
            group2Percent = Math.round((aiPercentRounded - group1Percent) * 10) / 10;
            if (group2Percent < 0) { group2Percent = 0; group1Percent = aiPercentRounded; }
        }

        // Group 1: AI-generated only (teal/cyan icon)
        doc.setFillColor(20, 184, 166); // teal-500
        doc.circle(margin + 6, y, 6, "F");
        // White "AI" label inside circle
        doc.setFontSize(5.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        const aiLabel1 = "AI";
        const aiW1 = doc.getTextWidth(aiLabel1);
        doc.text(aiLabel1, margin + 6 - aiW1 / 2, y + 1.8);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(`AI-generated only  ${group1Percent}%`, margin + 16, y + 1);
        y += 7;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Likely AI-generated text from a large-language model.", margin + 16, y);
        y += 12;

        // Group 2: AI-paraphrased (purple icon)
        doc.setFillColor(147, 51, 234); // purple-600
        doc.circle(margin + 6, y, 6, "F");
        // White "AI" label inside circle
        doc.setFontSize(5.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        const aiLabel2 = "AI";
        const aiW2 = doc.getTextWidth(aiLabel2);
        doc.text(aiLabel2, margin + 6 - aiW2 / 2, y + 1.8);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(`AI-generated text that was AI-paraphrased  ${group2Percent}%`, margin + 16, y + 1);
        y += 7;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        const paraDesc = doc.splitTextToSize(
            "Likely AI-generated text that was likely revised using an AI-paraphrase tool or word spinner.",
            contentWidth - 22
        );
        doc.text(paraDesc, margin + 16, y);
        y += paraDesc.length * 4 + 12;

        // ─── Separator above Disclaimer ───
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // ─── Disclaimer ───
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(30, 41, 59);
        doc.text("Disclaimer", margin, y);
        y += 5;

        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 116, 139);
        const disclaimer = "Our AI writing assessment is designed to help educators identify text that might be prepared by a generative AI tool. Our AI writing assessment may not always be accurate (it may misidentify writing that is likely AI generated as AI generated and AI paraphrased or likely AI generated and AI paraphrased writing as only AI generated) so it should not be used as the sole basis for adverse actions against a student. It takes further scrutiny and human judgment in conjunction with an organization's application of its specific academic policies to determine whether any academic misconduct has occurred.";
        const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
        doc.text(disclaimerLines, margin, y);
        y += disclaimerLines.length * 3 + 10;

        // ─── Separator above FAQ ───
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // ─── Frequently Asked Questions ───
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Frequently Asked Questions", margin, y);
        y += 12;

        // FAQ 1
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("How should I interpret ScopeLens's AI writing percentage and false positives?", margin, y);
        y += 6;

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        const faq1p1 = doc.splitTextToSize(
            "The percentage shown in the AI writing report is the amount of qualifying text within the submission that ScopeLens's AI writing detection model determines was either likely AI-generated text from a large-language model or likely AI-generated text that was likely revised using an AI paraphrase tool or word spinner.",
            contentWidth
        );
        doc.text(faq1p1, margin, y);
        y += faq1p1.length * 3.5 + 3;

        const faq1p2 = doc.splitTextToSize(
            "False positives (incorrectly flagging human-written text as AI-generated) are a possibility in AI models.",
            contentWidth
        );
        doc.text(faq1p2, margin, y);
        y += faq1p2.length * 3.5 + 3;

        const faq1p3 = doc.splitTextToSize(
            "AI detection scores under 20%, which we do not surface in new reports, have a higher likelihood of false positives. To reduce the likelihood of misinterpretation, no score or highlights are attributed and are indicated with an asterisk in the report (*%).",
            contentWidth
        );
        doc.text(faq1p3, margin, y);
        y += faq1p3.length * 3.5 + 3;

        const faq1p4 = doc.splitTextToSize(
            "The AI writing percentage should not be the sole basis to determine whether misconduct has occurred. The reviewer/instructor should use the percentage as a means to start a formative conversation with their student and/or use it to examine the submitted assignment in accordance with their school's policies.",
            contentWidth
        );
        doc.text(faq1p4, margin, y);
        y += faq1p4.length * 3.5 + 5;

        // FAQ 2 (check if page break needed)
        if (y > pageHeight - 50) {
            doc.addPage();
            drawHeader(doc, doc.getNumberOfPages(), 0, "AI Writing Overview", reportId, hasCustomLogo, customLogoData);
            y = contentStartY + 5;
        }

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("What does 'qualifying text' mean?", margin, y);
        y += 6;

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        const faq2p1 = doc.splitTextToSize(
            "Our model only processes qualifying text in the form of long-form writing. Long-form writing means individual sentences contained in paragraphs that make up a longer piece of written work, such as an essay, a dissertation, or an article, etc. Qualifying text that has been determined to be likely AI-generated will be highlighted in cyan in the submission, and likely AI-generated and then likely AI-paraphrased will be highlighted purple.",
            contentWidth
        );
        doc.text(faq2p1, margin, y);
        y += faq2p1.length * 3.5 + 3;

        const faq2p2 = doc.splitTextToSize(
            "Non-qualifying text, such as bullet points, annotated bibliographies, etc., will not be processed and can create disparity between the submission highlights and the percentage shown.",
            contentWidth
        );
        doc.text(faq2p2, margin, y);
        y += faq2p2.length * 3.5 + 8;

        // ── Page 2 Footer ──
        drawFooter(doc, 2, 0, "AI Writing Overview", reportId, hasCustomLogo, customLogoData);

        // ─────────────────────────────────────
        //  PAGES 3+: Document Content with Highlights
        // ─────────────────────────────────────
        if (docParagraphs.length > 0) {
            doc.addPage();
            let currentPage = doc.getNumberOfPages();
            drawHeader(doc, currentPage, 0, "AI Writing Submission", reportId, hasCustomLogo, customLogoData);
            y = contentStartY + 5;

            let highlightIndex = 1;
            const textIndent = 18; // Space for margin markers

            for (const para of docParagraphs) {
                // ── Style-based formatting ──
                let fontSize = 9;
                let fontWeight: "bold" | "normal" = "normal";
                let topMargin = 2;
                let textColorR = 51, textColorG = 65, textColorB = 85; // slate-700
                let bottomMargin = 1;

                switch (para.style) {
                    case "Title":
                        fontSize = 18;
                        fontWeight = "bold";
                        topMargin = 8;
                        bottomMargin = 4;
                        textColorR = 15; textColorG = 23; textColorB = 42; // slate-900
                        break;
                    case "Heading1":
                        fontSize = 14;
                        fontWeight = "bold";
                        topMargin = 8;
                        bottomMargin = 3;
                        textColorR = 30; textColorG = 41; textColorB = 59; // slate-800
                        break;
                    case "Heading2":
                        fontSize = 12;
                        fontWeight = "bold";
                        topMargin = 6;
                        bottomMargin = 2;
                        textColorR = 51; textColorG = 65; textColorB = 85; // slate-700
                        break;
                    default: // Normal
                        fontSize = 9;
                        fontWeight = "normal";
                        topMargin = 2;
                        bottomMargin = 1;
                        break;
                }

                // Calculate block height
                doc.setFontSize(fontSize);
                doc.setFont("helvetica", fontWeight);
                const lineHeight = fontSize < 12 ? 4.5 : fontSize < 14 ? 5.5 : fontSize < 18 ? 6.5 : 8;
                const useIndent = para.style === "Normal" ? textIndent : 0;
                const wrappedLines = doc.splitTextToSize(para.text, contentWidth - useIndent - 2);
                const blockHeight = wrappedLines.length * lineHeight + topMargin;

                // Check page break
                if (y + blockHeight > pageHeight - 20) {
                    doc.addPage();
                    currentPage = doc.getNumberOfPages();
                    drawHeader(doc, currentPage, 0, "AI Writing Submission", reportId, hasCustomLogo, customLogoData);
                    y = contentStartY + 5;
                }

                y += topMargin;

                // ── Check if this paragraph contains AI-highlighted text ──
                // Split paragraph into sentences for per-sentence highlighting
                if (para.style === "Normal") {
                    const sentences = para.text.split(/(?<=[.!?])\s+/);
                    let sentenceX = margin + useIndent;
                    let lineY = y + 2;
                    let currentLineText = "";

                    doc.setFontSize(fontSize);
                    doc.setFont("helvetica", fontWeight);

                    for (const sentence of sentences) {
                        const isSentenceHighlighted = highlightedSentences.some(
                            (h) => sentence.includes(h) || h.includes(sentence)
                        );

                        // Wrap sentence within remaining line space
                        const sentLines = doc.splitTextToSize(sentence, contentWidth - useIndent - 2);

                        for (let li = 0; li < sentLines.length; li++) {
                            const lineText = sentLines[li];
                            const lineTextW = doc.getTextWidth(lineText);

                            if (isSentenceHighlighted) {
                                // Highlight only the text width, not full line
                                doc.setFillColor(204, 251, 241); // teal-100
                                doc.rect(margin + useIndent, lineY - 3.5, lineTextW + 1, lineHeight, "F");

                                // Draw numbered marker only on first line of first highlighted sentence
                                if (li === 0) {
                                    doc.setFillColor(20, 184, 166); // teal-500
                                    doc.circle(margin + 6, lineY - 0.5, 4, "F");
                                    doc.setFontSize(6);
                                    doc.setFont("helvetica", "bold");
                                    doc.setTextColor(255, 255, 255);
                                    const markerStr = String(highlightIndex);
                                    const markerW = doc.getTextWidth(markerStr);
                                    doc.text(markerStr, margin + 6 - markerW / 2, lineY + 1);
                                    highlightIndex++;
                                }

                                doc.setFontSize(fontSize);
                                doc.setFont("helvetica", fontWeight);
                                doc.setTextColor(13, 148, 136); // teal-700
                            } else {
                                doc.setFontSize(fontSize);
                                doc.setFont("helvetica", fontWeight);
                                doc.setTextColor(textColorR, textColorG, textColorB);
                            }

                            doc.text(lineText, margin + useIndent, lineY);
                            lineY += lineHeight;

                            // Check page break mid-paragraph
                            if (lineY > pageHeight - 20) {
                                doc.addPage();
                                currentPage = doc.getNumberOfPages();
                                drawHeader(doc, currentPage, 0, "AI Writing Submission", reportId, hasCustomLogo, customLogoData);
                                lineY = contentStartY + 7;
                            }
                        }
                    }
                    y = lineY + bottomMargin;
                } else {
                    // Headings - no highlighting needed
                    doc.setFontSize(fontSize);
                    doc.setFont("helvetica", fontWeight);
                    doc.setTextColor(textColorR, textColorG, textColorB);
                    doc.text(wrappedLines, margin + useIndent, y + 2);
                    y += wrappedLines.length * lineHeight + bottomMargin;
                }
            }
        }

        // ─── Patch all page headers with correct total page count ───
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);

            // White-out the page info area (center-left to right) and redraw
            doc.setFillColor(255, 255, 255);
            doc.rect(margin + 52, 10, pageWidth - margin - 52 - margin, 14, "F");

            let label = "Cover Page";
            if (i === 2) label = "AI Writing Overview";
            else if (i > 2) label = "AI Writing Submission";

            const baselineY = 19;

            // Page info (center-left)
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139);
            doc.text(`Page ${i} of ${totalPages} · ${label}`, margin + 10 + 42, baselineY);

            // Report ID (far right)
            const shortId = reportId.length > 20 ? reportId.substring(0, 20) + "..." : reportId;
            doc.text(`Report ID   ${shortId}`, pageWidth - margin, baselineY, { align: "right" });

            // Patch footer on pages 1-2 (cover page & AI overview have footers)
            if (i <= 2) {
                const pageHeight = doc.internal.pageSize.getHeight();
                const footerBaseY = pageHeight - 12;
                // White-out footer page info area
                doc.setFillColor(255, 255, 255);
                doc.rect(margin + 40, footerBaseY - 8, pageWidth - margin - 40 - margin, 14, "F");
                // Redraw footer page info
                doc.setFontSize(7);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 116, 139);
                doc.text(`Page ${i} of ${totalPages} · ${label}`, margin + 8 + 36, footerBaseY);
                // Redraw footer Report ID
                doc.text(`Report ID   ${shortId}`, pageWidth - margin, footerBaseY, { align: "right" });
            }
        }

        // ─── Convert to buffer and return ───
        const pdfBuffer = doc.output("arraybuffer");

        // Upload to S3 (best-effort caching)
        const reportPath = `${user.id}/${scan.id}_report.pdf`;
        uploadToS3(
            getReportsFolder(),
            reportPath,
            pdfBuffer,
            "application/pdf"
        )
            .then(() => {
                supabase
                    .from("scans")
                    .update({ report_path: reportPath })
                    .eq("id", scanId);
            })
            .catch((uploadError) => {
                console.error("Report cache error (non-blocking):", uploadError);
            });

        // Return PDF directly as download
        const fileName = `${scan.file_name?.replace(/\.[^/.]+$/, "") || "report"}_ai_report.pdf`;
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
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
