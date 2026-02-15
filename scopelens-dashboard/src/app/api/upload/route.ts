import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadToS3, deleteFromS3, getDocumentsFolder } from "@/lib/s3";
import JSZip from "jszip";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service role client for privileged operations
function getAdminClient() {
    return createSupabaseClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// Extract text from DOCX file buffer
async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file("word/document.xml")?.async("text");
    if (!docXml) return "";

    // Extract all <w:t> text runs
    let text = "";
    const paraRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
    let paraMatch;

    while ((paraMatch = paraRegex.exec(docXml)) !== null) {
        const paraXml = paraMatch[0];
        let paraText = "";
        const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        let textMatch;
        while ((textMatch = textRegex.exec(paraXml)) !== null) {
            paraText += textMatch[1];
        }
        if (paraText.trim()) {
            text += paraText.trim() + "\n\n";
        }
    }

    return text.trim();
}

// Validate file magic bytes to prevent disguised malicious files
function validateMimeType(buffer: ArrayBuffer, fileName: string): { valid: boolean; detectedType: string } {
    const bytes = new Uint8Array(buffer);

    // DOCX files are ZIP archives starting with PK\x03\x04
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
        return { valid: true, detectedType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
    }

    // TXT files: check it's valid UTF-8/ASCII text (no null bytes in first 8KB)
    if (fileName.endsWith(".txt")) {
        const checkLen = Math.min(bytes.length, 8192);
        for (let i = 0; i < checkLen; i++) {
            if (bytes[i] === 0x00) {
                return { valid: false, detectedType: "binary" };
            }
        }
        return { valid: true, detectedType: "text/plain" };
    }

    return { valid: false, detectedType: "unknown" };
}

// Count words in text
function countWords(text: string): number {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const DEFAULT_WORD_LIMIT = 5000;

// Fetch word limit from system_settings table (fallback to default)
async function getWordLimit(): Promise<number> {
    try {
        const adminClient = getAdminClient();
        const { data, error } = await adminClient
            .from("system_settings")
            .select("value")
            .eq("key", "word_limit")
            .single();

        if (!error && data?.value) {
            const limit = parseInt(data.value);
            if (!isNaN(limit) && limit >= 100) return limit;
        }
    } catch {
        // Silently fall back to default
    }
    return DEFAULT_WORD_LIMIT;
}


export async function POST(request: NextRequest) {
    try {
        let supabase;
        const authHeader = request.headers.get("Authorization");
        if (authHeader) {
            supabase = createSupabaseClient(
                process.env.SUPABASE_URL!,
                process.env.SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: authHeader } } }
            );
        } else {
            supabase = await createClient();
        }

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const scanType = (formData.get("scanType") as string) || "ai";

        // Validate scan type
        if (!["ai", "plagiarism"].includes(scanType)) {
            return NextResponse.json({ error: "Invalid scan type. Must be 'ai' or 'plagiarism'." }, { status: 400 });
        }

        const creditCost = scanType === "plagiarism" ? 2 : 1;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file extension
        const ext = file.name.toLowerCase().split('.').pop();
        if (!ext || !["docx", "txt"].includes(ext)) {
            return NextResponse.json({ error: "Invalid file type. Only DOCX and TXT files are allowed." }, { status: 400 });
        }

        // Validate file MIME type (browser-reported)
        const allowedTypes = [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Only DOCX and TXT files are allowed." }, { status: 400 });
        }

        // Validate file size (20MB max)
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File too large. Maximum size is 20MB." }, { status: 400 });
        }

        // Read file buffer for magic bytes validation
        const arrayBuffer = await file.arrayBuffer();

        // Validate MIME type via magic bytes (prevent disguised malicious files)
        const mimeCheck = validateMimeType(arrayBuffer, file.name);
        if (!mimeCheck.valid) {
            return NextResponse.json(
                { error: "File content does not match its extension. Upload rejected for security." },
                { status: 400 }
            );
        }

        // --- Credit-based scan enforcement ---
        const now = new Date();

        // Get user's active subscription and plan limits
        let { data: subscription, error: subError } = await supabase
            .from("subscriptions")
            .select("*, plans(*)")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

        if (subError) {
            console.error("Error fetching subscription:", subError);
        }

        let isFreeTier = true;

        if (subscription && subscription.plans) {
            const currentPeriodEnd = new Date(subscription.current_period_end);

            if (currentPeriodEnd < now) {
                // Subscription expired — fall back to free tier
                console.log(`Subscription ${subscription.id} expired on ${currentPeriodEnd.toISOString()}`);
                isFreeTier = true;
            } else {
                isFreeTier = false;

                // Check credit expiration
                const creditsExpiresAt = subscription.credits_expires_at
                    ? new Date(subscription.credits_expires_at)
                    : null;

                if (creditsExpiresAt && creditsExpiresAt < now) {
                    return NextResponse.json(
                        { error: "Your credits have expired. Please renew your plan or purchase more credits." },
                        { status: 403 }
                    );
                }

                // Check credits remaining
                const creditsRemaining = subscription.credits_remaining ?? 0;
                if (creditsRemaining < creditCost) {
                    return NextResponse.json(
                        { error: `Not enough credits. ${scanType === "plagiarism" ? "Plagiarism scans require 2 credits" : "AI scans require 1 credit"}. You have ${creditsRemaining} credit${creditsRemaining === 1 ? "" : "s"} remaining.` },
                        { status: 403 }
                    );
                }
            }
        }

        if (isFreeTier) {
            // No valid subscription or expired — check free plan limit
            const { data: freePlan } = await supabase
                .from("plans")
                .select("credits")
                .eq("slug", "free")
                .single();
            const freeLimit = freePlan?.credits || 1;

            // Count scans today for free users (calendar day)
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const { count } = await supabase
                .from("scans")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .gte("created_at", startOfDay.toISOString());
            const scansUsed = count || 0;

            if (scansUsed >= freeLimit) {
                return NextResponse.json(
                    { error: `Daily limit reached. Free plan allows ${freeLimit} scan${freeLimit === 1 ? '' : 's'} per day. Upgrade your plan for more credits.` },
                    { status: 403 }
                );
            }
        }

        // Extract text content
        let textContent = "";
        if (file.type === "text/plain") {
            textContent = new TextDecoder().decode(arrayBuffer);
        } else if (
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.name.endsWith(".docx")
        ) {
            try {
                textContent = await extractDocxText(arrayBuffer);
            } catch (extractErr) {
                console.error("DOCX text extraction failed:", extractErr);
                textContent = "";
            }
        }

        // Validate word count against configurable limit
        if (textContent) {
            const wordCount = countWords(textContent);
            const maxWordCount = await getWordLimit();
            if (wordCount > maxWordCount) {
                return NextResponse.json(
                    { error: `Document exceeds the ${maxWordCount.toLocaleString()} word limit. Your document has ${wordCount.toLocaleString()} words. Please shorten it and try again.` },
                    { status: 400 }
                );
            }
        }

        // Create unique file path: user_id/timestamp_filename
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${user.id}/${timestamp}_${sanitizedName}`;

        // Upload to S3
        let uploadResult: { path: string };
        try {
            uploadResult = await uploadToS3(
                getDocumentsFolder(),
                filePath,
                arrayBuffer,
                file.type
            );
        } catch (uploadError) {
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
                file_path: uploadResult.path,
                status: "pending",
                scan_type: scanType,
                ai_score: null
            })
            .select()
            .single();

        if (scanError) {
            console.error("Scan record error:", scanError);
            // Try to delete the uploaded file from S3 if DB insert fails
            try { await deleteFromS3(getDocumentsFolder(), filePath); } catch { }
            return NextResponse.json({ error: "Failed to create scan record", details: scanError.message }, { status: 500 });
        }

        // Insert into appropriate queue for processing (use admin client to bypass RLS)
        if (textContent && textContent.length > 0) {
            const adminClient = getAdminClient();
            const queueTable = scanType === "plagiarism" ? "plagiarism_queue" : "scan_queue";
            const { error: queueError } = await adminClient
                .from(queueTable)
                .insert({
                    scan_id: scan.id,
                    input_text: textContent,
                    status: "waiting",
                });

            if (queueError) {
                console.error(`Failed to insert into ${queueTable}:`, queueError);
            }
        }

        // Decrement credits for paid plans
        if (!isFreeTier && subscription) {
            const adminClient = getAdminClient();
            const currentCredits = subscription.credits_remaining ?? 0;
            await adminClient
                .from("subscriptions")
                .update({
                    credits_remaining: Math.max(0, currentCredits - creditCost),
                    updated_at: now.toISOString()
                })
                .eq("id", subscription.id);
        }

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
