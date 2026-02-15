import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Split text into sentences
function splitSentences(text: string): string[] {
    // Split on sentence-ending punctuation followed by space or newline
    const raw = text
        .replace(/\n\n+/g, ". ")
        .replace(/\n/g, " ")
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 20); // Filter out very short fragments

    return raw;
}

// Build search queries from sentence groups
function buildSearchQueries(sentences: string[], groupSize: number = 3): string[] {
    const queries: string[] = [];
    for (let i = 0; i < sentences.length; i += groupSize) {
        const group = sentences.slice(i, i + groupSize);
        // Take first 200 chars from each sentence for the query
        const query = group.map(s => s.substring(0, 200)).join(" ");
        // CORE API has a query length limit, truncate to ~500 chars
        queries.push(query.substring(0, 500));
    }
    return queries;
}

// N-gram overlap similarity between two texts (word-level bigrams)
function calculateSimilarity(text1: string, text2: string): number {
    const normalize = (t: string) =>
        t.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 2);

    const words1 = normalize(text1);
    const words2 = normalize(text2);

    if (words1.length < 3 || words2.length < 3) return 0;

    // Create bigrams
    const bigrams1 = new Set<string>();
    for (let i = 0; i < words1.length - 1; i++) {
        bigrams1.add(`${words1[i]}_${words1[i + 1]}`);
    }

    const bigrams2 = new Set<string>();
    for (let i = 0; i < words2.length - 1; i++) {
        bigrams2.add(`${words2[i]}_${words2[i + 1]}`);
    }

    // Calculate Dice coefficient
    let intersection = 0;
    for (const bg of bigrams1) {
        if (bigrams2.has(bg)) intersection++;
    }

    if (bigrams1.size + bigrams2.size === 0) return 0;
    return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
}

// Find which sentences match a source
function findMatchingSentences(
    sentences: string[],
    sourceText: string,
    threshold: number = 0.15
): { index: number; sentence: string; similarity: number }[] {
    const matches: { index: number; sentence: string; similarity: number }[] = [];

    for (let i = 0; i < sentences.length; i++) {
        const sim = calculateSimilarity(sentences[i], sourceText);
        if (sim >= threshold) {
            matches.push({ index: i, sentence: sentences[i], similarity: sim });
        }
    }

    return matches;
}

interface MatchedSource {
    title: string;
    authors: string[];
    year: number | null;
    doi: string | null;
    url: string | null;
    matchPercentage: number;
    matchedSentences: { index: number; sentence: string; similarity: number }[];
    sourceType: string;
}

// Call CORE API to search for works
async function searchCoreAPI(
    apiKey: string,
    query: string,
    limit: number = 5
): Promise<unknown[]> {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://api.core.ac.uk/v3/search/works/?q=${encodedQuery}&limit=${limit}`;

        const res = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
            },
        });

        if (!res.ok) {
            console.error(`CORE API error: ${res.status} ${res.statusText}`);
            return [];
        }

        const data = await res.json();
        return data.results || [];
    } catch (error) {
        console.error("CORE API fetch error:", error);
        return [];
    }
}

// Rate limiter: simple delay between calls
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST() {
    try {
        const supabase = createAdminClient();

        // 1. Fetch an active CORE API account
        const { data: accounts, error: accError } = await supabase
            .from("core_api_accounts")
            .select("*")
            .eq("is_active", true)
            .order("total_requests", { ascending: true })
            .limit(1);

        if (accError || !accounts || accounts.length === 0) {
            return NextResponse.json(
                { error: "No active CORE API accounts configured" },
                { status: 400 }
            );
        }

        const account = accounts[0];

        // 2. Fetch waiting items from plagiarism_queue
        const { data: queueItems, error: queueError } = await supabase
            .from("plagiarism_queue")
            .select("*")
            .eq("status", "waiting")
            .order("created_at", { ascending: true })
            .limit(5); // Process up to 5 items per call

        if (queueError) {
            return NextResponse.json({ error: queueError.message }, { status: 500 });
        }

        if (!queueItems || queueItems.length === 0) {
            return NextResponse.json({ processed: 0, remaining: 0 });
        }

        let processedCount = 0;

        for (const item of queueItems) {
            try {
                // Mark as processing
                await supabase
                    .from("plagiarism_queue")
                    .update({ status: "processing", started_at: new Date().toISOString() })
                    .eq("id", item.id);

                // Update scan status too
                await supabase
                    .from("scans")
                    .update({ status: "processing" })
                    .eq("id", item.scan_id);

                const inputText = item.input_text;
                const sentences = splitSentences(inputText);

                if (sentences.length === 0) {
                    // No sentences to check — mark as completed with 0%
                    await supabase
                        .from("plagiarism_queue")
                        .update({
                            status: "completed",
                            completed_at: new Date().toISOString(),
                            result: { overallScore: 0, sources: [], totalSentences: 0 },
                        })
                        .eq("id", item.id);

                    await supabase
                        .from("scans")
                        .update({
                            status: "completed",
                            plagiarism_score: 0,
                            plagiarism_result: { overallScore: 0, sources: [], totalSentences: 0 },
                            completed_at: new Date().toISOString(),
                        })
                        .eq("id", item.scan_id);

                    processedCount++;
                    continue;
                }

                // Build search queries from sentence groups
                const searchQueries = buildSearchQueries(sentences, 3);

                // Collect all unique sources from CORE API results
                const sourceMap = new Map<string, {
                    work: Record<string, unknown>;
                    compareText: string;
                }>();

                for (const query of searchQueries) {
                    const results = await searchCoreAPI(account.api_key, query, 5);

                    for (const work of results as Record<string, unknown>[]) {
                        const workId = (work.id as string) || (work.doi as string) || (work.title as string) || "";
                        if (!workId || sourceMap.has(workId)) continue;

                        // Use abstract + title for comparison
                        const compareText = [
                            (work.title as string) || "",
                            (work.abstract as string) || "",
                        ].join(" ").trim();

                        if (compareText.length > 30) {
                            sourceMap.set(workId, { work, compareText });
                        }
                    }

                    // Increment total requests
                    await supabase
                        .from("core_api_accounts")
                        .update({ total_requests: account.total_requests + 1 })
                        .eq("id", account.id);
                    account.total_requests++;

                    // Rate limit: 150ms between calls
                    await sleep(150);
                }

                // Compare each source against document sentences
                const matchedSources: MatchedSource[] = [];

                for (const [, { work, compareText }] of sourceMap) {
                    const matches = findMatchingSentences(sentences, compareText, 0.15);

                    if (matches.length > 0) {
                        const matchPercentage = Math.round((matches.length / sentences.length) * 100);

                        // Extract source metadata
                        const authors = Array.isArray(work.authors)
                            ? (work.authors as { name?: string }[]).map(a => a.name || "Unknown")
                            : [];

                        const year = work.yearPublished
                            ? Number(work.yearPublished)
                            : null;

                        const urls = work.links as { url?: string; type?: string }[] | undefined;
                        const url = (urls && urls.length > 0 ? urls[0].url : (work.downloadUrl as string)) ?? null;

                        matchedSources.push({
                            title: (work.title as string) || "Untitled",
                            authors,
                            year,
                            doi: (work.doi as string) || null,
                            url,
                            matchPercentage,
                            matchedSentences: matches,
                            sourceType: "Publication",
                        });
                    }
                }

                // Sort by match percentage descending
                matchedSources.sort((a, b) => b.matchPercentage - a.matchPercentage);

                // Calculate overall plagiarism score
                // = percentage of sentences that matched at least one source
                const matchedSentenceIndices = new Set<number>();
                for (const source of matchedSources) {
                    for (const m of source.matchedSentences) {
                        matchedSentenceIndices.add(m.index);
                    }
                }
                const overallScore = Math.round((matchedSentenceIndices.size / sentences.length) * 100);

                const result = {
                    overallScore,
                    totalSentences: sentences.length,
                    matchedSentenceCount: matchedSentenceIndices.size,
                    sources: matchedSources.slice(0, 20), // Top 20 sources
                    matchedSentenceIndices: Array.from(matchedSentenceIndices).sort((a, b) => a - b),
                };

                // Save results
                await supabase
                    .from("plagiarism_queue")
                    .update({
                        status: "completed",
                        completed_at: new Date().toISOString(),
                        result,
                    })
                    .eq("id", item.id);

                await supabase
                    .from("scans")
                    .update({
                        status: "completed",
                        plagiarism_score: overallScore,
                        plagiarism_result: result,
                        completed_at: new Date().toISOString(),
                    })
                    .eq("id", item.scan_id);

                processedCount++;

            } catch (itemError) {
                console.error(`Error processing plagiarism queue item ${item.id}:`, itemError);

                // Increment failed requests
                await supabase
                    .from("core_api_accounts")
                    .update({ failed_requests: account.failed_requests + 1 })
                    .eq("id", account.id);

                // Mark as failed 
                const retryCount = (item.retry_count || 0) + 1;
                await supabase
                    .from("plagiarism_queue")
                    .update({
                        status: retryCount >= 3 ? "failed" : "waiting",
                        error: String(itemError),
                        retry_count: retryCount,
                    })
                    .eq("id", item.id);

                if (retryCount >= 3) {
                    await supabase
                        .from("scans")
                        .update({ status: "failed" })
                        .eq("id", item.scan_id);
                }
            }
        }

        // Count remaining
        const { count: remaining } = await supabase
            .from("plagiarism_queue")
            .select("*", { count: "exact", head: true })
            .eq("status", "waiting");

        return NextResponse.json({
            processed: processedCount,
            remaining: remaining || 0,
        });

    } catch (error) {
        console.error("Plagiarism process error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
