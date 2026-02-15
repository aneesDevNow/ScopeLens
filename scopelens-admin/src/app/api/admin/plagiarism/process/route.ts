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

// Find which sentences match a source using sliding-window comparison
function findMatchingSentences(
    sentences: string[],
    sourceText: string,
    threshold: number = 0.25
): { index: number; sentence: string; similarity: number }[] {
    const matches: { index: number; sentence: string; similarity: number }[] = [];
    const sourceWords = sourceText.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 2);

    for (let i = 0; i < sentences.length; i++) {
        const sentWords = sentences[i].toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 2);
        if (sentWords.length < 3) continue;

        let bestSim = 0;

        if (sourceWords.length <= 80) {
            // Short source (abstract-only): compare directly
            bestSim = calculateSimilarity(sentences[i], sourceText);
        } else {
            // Long source (full text): use sliding window
            const windowSize = Math.max(sentWords.length * 3, 40);
            const step = Math.max(Math.floor(windowSize / 3), 5);

            for (let w = 0; w <= sourceWords.length - windowSize; w += step) {
                const windowText = sourceWords.slice(w, w + windowSize).join(" ");
                const sim = calculateSimilarity(sentences[i], windowText);
                if (sim > bestSim) bestSim = sim;
                if (bestSim >= 0.6) break; // High confidence, no need to keep searching
            }
        }

        if (bestSim >= threshold) {
            matches.push({ index: i, sentence: sentences[i], similarity: bestSim });
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

// Detect if a sentence is enclosed in quotation marks in the original text
function isQuoted(fullText: string, sentence: string): boolean {
    const escaped = sentence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Check for various quotation mark patterns around the sentence
    const patterns = [
        new RegExp(`["\u201C]\\s*${escaped}\\s*["\u201D]`),     // "sentence" or \u201Csentence\u201D
        new RegExp(`['‘]\\s*${escaped}\\s*['’]`),     // 'sentence' or \u2018sentence\u2019
        new RegExp(`\u00AB\\s*${escaped}\\s*\u00BB`),           // \u00ABsentence\u00BB
    ];
    return patterns.some(p => p.test(fullText));
}

// Detect if there's an in-text citation near a matched sentence
function hasCitation(fullText: string, sentence: string): boolean {
    const idx = fullText.indexOf(sentence);
    if (idx === -1) return false;
    // Look at 200 chars after the sentence end for nearby citation
    const afterText = fullText.substring(idx + sentence.length, idx + sentence.length + 200);
    const beforeText = fullText.substring(Math.max(0, idx - 100), idx);
    const context = beforeText + afterText;
    // Common citation patterns
    const citationPatterns = [
        /\([A-Z][a-z]+(?:\s(?:et\s+al\.?|and|&)\s*[A-Z][a-z]+)*,?\s*\d{4}[a-z]?\)/,  // (Author, 2020) or (Author et al., 2020)
        /\[[\d,;\s-]+\]/,                          // [1] or [1, 2] or [1-3]
        /\([A-Z][a-z]+\s+\d{4}[a-z]?\)/,           // (Smith 2020)
        /\([A-Z][a-z]+(?:\s+&\s+[A-Z][a-z]+)+,?\s*\d{4}\)/, // (Smith & Jones, 2020)
        /\((?:see|cf\.?)\s+[A-Z][a-z]+/,            // (see Author...) or (cf. Author...)
        /\([Ii]bid\.?\)/,                           // (ibid.) or (Ibid)
    ];
    return citationPatterns.some(p => p.test(context));
}

// Classify source type based on CORE API work metadata
function classifySourceType(work: Record<string, unknown>): string {
    const doi = work.doi as string | undefined;
    const urls = work.links as { url?: string; type?: string }[] | undefined;
    const downloadUrl = work.downloadUrl as string | undefined;
    const hasUrl = (urls && urls.length > 0) || !!downloadUrl;

    // If it has a DOI, it's a formal publication
    if (doi) return "Publication";
    // If it only has URLs but no DOI, treat as Internet source
    if (hasUrl) return "Internet";
    // Default to publication
    return "Publication";
}

// Call CORE API to search for works
async function searchCoreAPI(
    apiKey: string,
    query: string,
    limit: number = 10
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
        console.log(`[PLAG] ✅ Using CORE API account: ${account.id} (${account.total_requests} total requests so far)`);

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
            console.log("[PLAG] No waiting items in queue.");
            return NextResponse.json({ processed: 0, remaining: 0 });
        }

        console.log(`[PLAG] 📋 Found ${queueItems.length} waiting items in plagiarism_queue`);

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

                console.log(`[PLAG] ── Item ${item.id} (scan: ${item.scan_id}) ──`);
                console.log(`[PLAG]   Input text length: ${inputText.length} chars`);
                console.log(`[PLAG]   Sentences extracted: ${sentences.length}`);
                if (sentences.length > 0) {
                    console.log(`[PLAG]   First sentence: "${sentences[0].substring(0, 100)}..."`);
                    console.log(`[PLAG]   Last sentence: "${sentences[sentences.length - 1].substring(0, 100)}..."`);
                }

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
                console.log(`[PLAG]   Search queries built: ${searchQueries.length}`);
                for (let qi = 0; qi < Math.min(searchQueries.length, 3); qi++) {
                    console.log(`[PLAG]   Query ${qi + 1}: "${searchQueries[qi].substring(0, 120)}..."`);
                }

                // Collect all unique sources from CORE API results
                const sourceMap = new Map<string, {
                    work: Record<string, unknown>;
                    compareText: string;
                }>();

                let queryIdx = 0;
                for (const query of searchQueries) {
                    queryIdx++;
                    const results = await searchCoreAPI(account.api_key, query, 10);
                    console.log(`[PLAG]   CORE API query ${queryIdx}/${searchQueries.length}: ${results.length} results returned`);

                    for (const work of results as Record<string, unknown>[]) {
                        const workId = (work.id as string) || (work.doi as string) || (work.title as string) || "";
                        if (!workId || sourceMap.has(workId)) continue;

                        // Use fullText if available, otherwise title + abstract
                        const fullTextField = (work.fullText as string) || "";
                        const compareText = fullTextField.length > 100
                            ? fullTextField
                            : [
                                (work.title as string) || "",
                                (work.abstract as string) || "",
                            ].join(" ").trim();

                        if (compareText.length > 30) {
                            sourceMap.set(workId, { work, compareText });
                            const hasFullText = fullTextField.length > 100;
                            console.log(`[PLAG]     + Source: "${((work.title as string) || 'Untitled').substring(0, 80)}" | fullText: ${hasFullText ? 'YES (' + fullTextField.length + ' chars)' : 'NO (using abstract ' + compareText.length + ' chars)'} | type: ${classifySourceType(work)} | DOI: ${(work.doi as string) || 'none'}`);
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

                console.log(`[PLAG]   Total unique sources collected: ${sourceMap.size}`);

                // Compare each source against document sentences
                const matchedSources: MatchedSource[] = [];
                let sourceIdx = 0;

                for (const [, { work, compareText }] of sourceMap) {
                    sourceIdx++;
                    const matches = findMatchingSentences(sentences, compareText, 0.25);

                    if (matches.length > 0) {
                        const matchPercentage = Math.round((matches.length / sentences.length) * 100);
                        const avgSim = matches.reduce((s, m) => s + m.similarity, 0) / matches.length;
                        console.log(`[PLAG]   🔍 Source ${sourceIdx}: "${((work.title as string) || 'Untitled').substring(0, 60)}" → ${matches.length} matched sentences (${matchPercentage}%), avg similarity: ${(avgSim * 100).toFixed(1)}%`);
                        for (const m of matches.slice(0, 3)) {
                            console.log(`[PLAG]       Sentence #${m.index} (sim: ${(m.similarity * 100).toFixed(1)}%): "${m.sentence.substring(0, 100)}..."`);
                        }
                        if (matches.length > 3) console.log(`[PLAG]       ... and ${matches.length - 3} more matches`);

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
                            sourceType: classifySourceType(work),
                        });
                    } else {
                        console.log(`[PLAG]   ⬜ Source ${sourceIdx}: "${((work.title as string) || 'Untitled').substring(0, 60)}" → 0 matches`);
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

                console.log(`[PLAG]   ═══════════════════════════════════════`);
                console.log(`[PLAG]   📊 RESULTS: Overall Score = ${overallScore}%`);
                console.log(`[PLAG]      Total sentences: ${sentences.length}`);
                console.log(`[PLAG]      Matched sentences: ${matchedSentenceIndices.size}`);
                console.log(`[PLAG]      Matched sources: ${matchedSources.length}`);
                console.log(`[PLAG]   ═══════════════════════════════════════`);

                // ─── Classify matched sentences into Match Groups ───
                let notCitedOrQuoted = 0;
                let missingQuotations = 0;
                let missingCitation = 0;
                let citedAndQuoted = 0;

                for (const sentIdx of matchedSentenceIndices) {
                    const sent = sentences[sentIdx];
                    const quoted = isQuoted(inputText, sent);
                    const cited = hasCitation(inputText, sent);

                    if (cited && quoted) {
                        citedAndQuoted++;
                    } else if (quoted && !cited) {
                        missingCitation++;
                    } else if (cited && !quoted) {
                        missingQuotations++;
                    } else {
                        notCitedOrQuoted++;
                    }
                }

                console.log(`[PLAG]   Match Groups: NotCited=${notCitedOrQuoted}, MissingQuotes=${missingQuotations}, MissingCite=${missingCitation}, CitedQuoted=${citedAndQuoted}`);

                const totalMatched = matchedSentenceIndices.size || 1;
                const matchGroups = {
                    notCitedOrQuoted: { count: notCitedOrQuoted, percent: Math.round((notCitedOrQuoted / sentences.length) * 100) },
                    missingQuotations: { count: missingQuotations, percent: Math.round((missingQuotations / sentences.length) * 100) },
                    missingCitation: { count: missingCitation, percent: Math.round((missingCitation / sentences.length) * 100) },
                    citedAndQuoted: { count: citedAndQuoted, percent: Math.round((citedAndQuoted / sentences.length) * 100) },
                };

                // ─── Source type breakdown ───
                const topSources = matchedSources.slice(0, 20);
                const internetPct = topSources
                    .filter(src => src.sourceType === "Internet")
                    .reduce((sum, src) => sum + src.matchPercentage, 0);
                const publicationPct = topSources
                    .filter(src => src.sourceType === "Publication")
                    .reduce((sum, src) => sum + src.matchPercentage, 0);
                const studentPct = topSources
                    .filter(src => src.sourceType === "Student papers")
                    .reduce((sum, src) => sum + src.matchPercentage, 0);

                const sourceTypeBreakdown = {
                    internet: Math.round(internetPct),
                    publications: Math.round(publicationPct),
                    studentPapers: Math.round(studentPct),
                };

                console.log(`[PLAG]   Source Types: Internet=${Math.round(internetPct)}%, Publications=${Math.round(publicationPct)}%, StudentPapers=${Math.round(studentPct)}%`);

                const result = {
                    overallScore,
                    totalSentences: sentences.length,
                    matchedSentenceCount: matchedSentenceIndices.size,
                    sources: topSources,
                    matchedSentenceIndices: Array.from(matchedSentenceIndices).sort((a, b) => a - b),
                    matchGroups,
                    sourceTypeBreakdown,
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
                console.log(`[PLAG]   ✅ Item ${item.id} completed. Score: ${overallScore}%`);

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

    } catch (error: unknown) {
        console.error("[PLAG] ❌ Plagiarism process error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
