import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadToS3, downloadFromS3, getDocumentsFolder, getReportsFolder } from "@/lib/s3";
import JSZip from "jszip";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/pdf/ReportDocument";
import type { DocParagraph } from "@/components/pdf/reportStyles";
import fs from "fs";
import path from "path";

// ─── Parse DOCX file to extract paragraphs with styles ───
async function parseDocxStructure(buffer: ArrayBuffer): Promise<DocParagraph[]> {
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file("word/document.xml")?.async("text");
    if (!docXml) return [];

    const paragraphs: DocParagraph[] = [];

    // Extract the body content
    const bodyMatch = docXml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/);
    const body = bodyMatch ? bodyMatch[1] : docXml;

    // Helper: extract all text from a chunk of XML
    const extractText = (xml: string): string => {
        let text = "";
        const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        let m;
        while ((m = textRegex.exec(xml)) !== null) text += m[1];
        return text.trim();
    };

    // Helper: get paragraph style
    const getStyle = (paraXml: string): DocParagraph["style"] => {
        const sm = paraXml.match(/<w:pStyle\s+w:val="([^"]+)"/);
        if (sm) {
            const raw = sm[1];
            if (raw === "Title") return "Title";
            if (raw === "Heading1" || /^heading\s*1$/i.test(raw)) return "Heading1";
            if (raw === "Heading2" || /^heading\s*2$/i.test(raw)) return "Heading2";
        }
        return "Normal";
    };

    // Process body sequentially — match tables and paragraphs in order
    // Use a regex that matches either a table or a paragraph at the top level of body
    const elementRegex = /<w:tbl[\s>][\s\S]*?<\/w:tbl>|<w:p[\s>][\s\S]*?<\/w:p>/g;
    let match;

    while ((match = elementRegex.exec(body)) !== null) {
        const xml = match[0];

        if (xml.startsWith("<w:tbl")) {
            // ─── Table element ───
            const rows: string[][] = [];
            const rowRegex = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
            let rowMatch;
            while ((rowMatch = rowRegex.exec(xml)) !== null) {
                const cells: string[] = [];
                const cellRegex = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
                let cellMatch;
                while ((cellMatch = cellRegex.exec(rowMatch[0])) !== null) {
                    cells.push(extractText(cellMatch[0]));
                }
                if (cells.length > 0) rows.push(cells);
            }
            if (rows.length > 0) {
                paragraphs.push({ style: "Table", text: "", rows });
            }
        } else {
            // ─── Paragraph element ───
            const style = getStyle(xml);
            const text = extractText(xml);
            if (text) {
                paragraphs.push({ style, text });
            }
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

        // TODO: Re-enable S3 caching after testing
        // Check if report already exists (cached in S3)
        // if (scan.report_path) {
        //     const { data: cachedReport, error: downloadError } = await downloadFromS3(
        //         getReportsFolder(),
        //         scan.report_path
        //     );
        //     if (!downloadError && cachedReport) {
        //         const fileName = `${scan.file_name?.replace(/\.[^/.]+$/, "") || "report"}_ai_report.pdf`;
        //         return new NextResponse(new Uint8Array(cachedReport), {
        //             status: 200,
        //             headers: {
        //                 "Content-Type": "application/pdf",
        //                 "Content-Disposition": `attachment; filename="${fileName}"`,
        //                 "Cache-Control": "private, max-age=3600",
        //             },
        //         });
        //     }
        // }

        // Get profile data (for author name)
        const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", user.id)
            .single();

        const authorName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Author";

        // Get site-wide custom logo from admin settings
        let customLogoData: string | undefined;

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
        //  Generate PDF using React PDF
        // ═══════════════════════════════════════
        const reportId = scan.id;

        // Randomized split of AI percentage between two groups
        let group1Percent = 0;
        let group2Percent = 0;
        if (aiPercentRounded > 0) {
            const splitRatio = 0.10 + Math.random() * 0.15;
            group1Percent = Math.round(aiPercentRounded * splitRatio * 10) / 10;
            group2Percent = Math.round((aiPercentRounded - group1Percent) * 10) / 10;
            if (group1Percent < 1 && aiPercentRounded > 5) group1Percent = Math.round(1 + Math.random() * 3);
            if (group2Percent < 1 && aiPercentRounded > 5) group2Percent = 1;
            group2Percent = Math.round((aiPercentRounded - group1Percent) * 10) / 10;
            if (group2Percent < 0) { group2Percent = 0; group1Percent = aiPercentRounded; }
        }

        const submissionDate = new Date(scan.created_at).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric"
        }) + ", " + new Date(scan.created_at).toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit", hour12: true
        });

        const downloadDate = new Date().toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric"
        }) + ", " + new Date().toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit", hour12: true
        });

        const totalPagesEst = Math.ceil((inputText.length || 500) / 2500) + 2;
        const totalChars = inputText.length || 0;

        const pdfBuffer = await renderToBuffer(
            createElement(ReportDocument, {
                authorName,
                fileName: scan.file_name || "Untitled Document",
                fileSize: formatFileSize(scan.file_size || 0),
                submissionDate,
                downloadDate,
                reportId,
                aiPercent: aiPercentRounded,
                group1Percent,
                group2Percent,
                paragraphs: docParagraphs,
                highlightedSentences,
                totalWords,
                totalChars,
                totalPagesEst,
                customLogoSrc: customLogoData,
                ...(() => {
                    const loadImg = (name: string) => {
                        try {
                            const buf = fs.readFileSync(path.join(process.cwd(), "public", "icons", name));
                            return `data:image/png;base64,${buf.toString("base64")}`;
                        } catch { return undefined; }
                    };
                    return {
                        faqImageSrc: loadImg("faq-illustration.png"),
                        robotTealSrc: loadImg("robot-teal.png"),
                        robotPurpleSrc: loadImg("robot-purple.png"),
                    };
                })(),
            }) as any
        );

        // TODO: Re-enable S3 upload after testing
        // const reportPath = `${user.id}/${scan.id}_report.pdf`;
        // uploadToS3(getReportsFolder(), reportPath, pdfBuffer, "application/pdf")
        //     .then(() => supabase.from("scans").update({ report_path: reportPath }).eq("id", scanId))
        //     .catch((err) => console.error("Report cache error:", err));

        // Return PDF directly as download
        const fileName = `${scan.file_name?.replace(/\.[^/.]+$/, "") || "report"}_ai_report.pdf`;
        return new NextResponse(new Uint8Array(pdfBuffer), {
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
