import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ZEROGPT_API_URL = "https://api.zerogpt.com/api/detect/detectText";
const BATCH_SIZE = 50; // Max items to process per invocation — keeps response time reasonable

// POST - Process queue: fair round-robin by user, respects account concurrency limits
export async function POST() {
    try {
        const supabase = createAdminClient();

        // 1. Get active accounts with their current load
        const { data: accounts, error: accountsError } = await supabase
            .from("zerogpt_accounts")
            .select("*")
            .eq("is_active", true);

        if (accountsError || !accounts?.length) {
            return NextResponse.json({
                error: "No active ZeroGPT accounts available",
                details: accountsError?.message
            }, { status: 400 });
        }

        // 2. Get count of currently processing items per account
        const { data: processingItems } = await supabase
            .from("scan_queue")
            .select("account_id")
            .eq("status", "processing");

        const accountLoad: Record<string, number> = {};
        (processingItems || []).forEach((item: { account_id: string | null }) => {
            if (item.account_id) {
                accountLoad[item.account_id] = (accountLoad[item.account_id] || 0) + 1;
            }
        });

        // 3. Find available slots across all accounts
        const availableAccounts = accounts.filter(
            (acc) => (accountLoad[acc.id] || 0) < acc.max_concurrent
        );

        if (!availableAccounts.length) {
            return NextResponse.json({
                message: "All accounts at max capacity",
                processing: processingItems?.length || 0
            });
        }

        const totalSlots = availableAccounts.reduce(
            (sum, acc) => sum + (acc.max_concurrent - (accountLoad[acc.id] || 0)),
            0
        );

        // 4. FAIR QUEUE: Get waiting items, then look up user_ids from scans
        //    Fetch more than we need so we can pick fairly across users
        const fetchLimit = Math.min(BATCH_SIZE * 3, 500);
        const { data: waitingItems, error: queueError } = await supabase
            .from("scan_queue")
            .select("*")
            .eq("status", "waiting")
            .order("created_at", { ascending: true })
            .limit(fetchLimit);

        if (queueError || !waitingItems?.length) {
            return NextResponse.json({
                message: "No items waiting in queue",
                details: queueError?.message
            });
        }

        // Look up user_ids from scans table
        const scanIds = [...new Set(waitingItems.map((item: { scan_id: string }) => item.scan_id))];
        const { data: scansData } = await supabase
            .from("scans")
            .select("id, user_id")
            .in("id", scanIds);

        const scanUserMap: Record<string, string> = {};
        (scansData || []).forEach((s: { id: string; user_id: string }) => {
            scanUserMap[s.id] = s.user_id;
        });

        // 5. ROUND-ROBIN: Group items by user, then pick one per user in rotation
        //    This ensures that if user A has 50 files and user B has 1 file,
        //    user B's file gets processed alongside user A's first file, not after all 50.
        interface QueueItemWithScan {
            id: string;
            scan_id: string;
            input_text: string;
            retry_count: number;
            user_id: string;
            [key: string]: unknown;
        }

        // Enrich items with user_id
        const enrichedItems: QueueItemWithScan[] = waitingItems.map((item: { scan_id: string;[key: string]: unknown }) => ({
            ...item,
            user_id: scanUserMap[item.scan_id] || "unknown",
        })) as QueueItemWithScan[];

        const userQueues: Map<string, QueueItemWithScan[]> = new Map();
        for (const item of enrichedItems) {
            const userId = item.user_id;
            if (!userQueues.has(userId)) {
                userQueues.set(userId, []);
            }
            userQueues.get(userId)!.push(item);
        }

        // Build fair order: round-robin across users
        const fairOrder: QueueItemWithScan[] = [];
        const maxItemsToProcess = Math.min(totalSlots, BATCH_SIZE);
        const userIds = Array.from(userQueues.keys());
        let round = 0;

        while (fairOrder.length < maxItemsToProcess) {
            let addedThisRound = false;
            for (const userId of userIds) {
                if (fairOrder.length >= maxItemsToProcess) break;
                const queue = userQueues.get(userId)!;
                if (round < queue.length) {
                    fairOrder.push(queue[round]);
                    addedThisRound = true;
                }
            }
            if (!addedThisRound) break; // All user queues exhausted
            round++;
        }

        // 6. Process each item with an available account
        const results = [];
        let accountIndex = 0;

        for (const item of fairOrder) {
            // Find next available account
            while (accountIndex < availableAccounts.length) {
                const acc = availableAccounts[accountIndex];
                const currentLoad = accountLoad[acc.id] || 0;
                if (currentLoad < acc.max_concurrent) {
                    break;
                }
                accountIndex++;
            }
            if (accountIndex >= availableAccounts.length) break;

            const account = availableAccounts[accountIndex];
            accountLoad[account.id] = (accountLoad[account.id] || 0) + 1;

            // Mark as processing
            await supabase
                .from("scan_queue")
                .update({
                    status: "processing",
                    account_id: account.id,
                    started_at: new Date().toISOString(),
                })
                .eq("id", item.id);

            // Call ZeroGPT API with retry logic
            const maxRetries = account.max_retries ?? 3;
            const currentRetry = item.retry_count ?? 0;

            try {
                const response = await fetch(ZEROGPT_API_URL, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json, text/plain, */*",
                        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
                        "Authorization": `Bearer ${account.bearer_token}`,
                        "Cache-Control": "no-cache",
                        "Content-Type": "application/json",
                        "Origin": "https://www.zerogpt.com",
                        "Pragma": "no-cache",
                        "Referer": "https://www.zerogpt.com/",
                        "Sec-Fetch-Dest": "empty",
                        "Sec-Fetch-Mode": "cors",
                        "Sec-Fetch-Site": "same-site",
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
                    },
                    body: JSON.stringify({ input_text: item.input_text }),
                });

                const data = await response.json();

                if (!response.ok || !data.success || data.code !== 200) {
                    // Any non-200 code is a transient error — eligible for retry
                    throw Object.assign(
                        new Error(data.message || `API returned code ${data.code || response.status}`),
                        { isTransient: true }
                    );
                }

                // Extract AI score from response
                const resultData = data.data;
                const aiScore = Math.round(resultData?.fakePercentage ?? 0);

                // Update queue item as completed
                await supabase
                    .from("scan_queue")
                    .update({
                        status: "completed",
                        result: data,
                        completed_at: new Date().toISOString(),
                    })
                    .eq("id", item.id);

                // Update the original scan with the AI score + ZeroGPT result data
                await supabase
                    .from("scans")
                    .update({
                        ai_score: aiScore,
                        status: "completed",
                        completed_at: new Date().toISOString(),
                        word_count: resultData?.textWords ?? null,
                        zerogpt_result: resultData ?? null,
                    })
                    .eq("id", item.scan_id);

                // Increment total_requests for the account
                await supabase
                    .from("zerogpt_accounts")
                    .update({
                        total_requests: account.total_requests + 1,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", account.id);

                results.push({ id: item.id, scan_id: item.scan_id, status: "completed", ai_score: aiScore });

            } catch (apiError: unknown) {
                const err = apiError as Error & { isTransient?: boolean };
                const errorMessage = err.message || "Unknown error";
                const isTransient = err.isTransient || false;

                // If transient error and retries remaining → re-queue for retry
                if (isTransient && currentRetry < maxRetries) {
                    await supabase
                        .from("scan_queue")
                        .update({
                            status: "waiting",
                            account_id: null,
                            retry_count: currentRetry + 1,
                            error: `Retry ${currentRetry + 1}/${maxRetries}: ${errorMessage}`,
                            started_at: null,
                        })
                        .eq("id", item.id);

                    results.push({
                        id: item.id,
                        scan_id: item.scan_id,
                        status: "retrying",
                        retry: currentRetry + 1,
                        max_retries: maxRetries,
                        error: errorMessage,
                    });
                } else {
                    // Max retries exhausted or non-transient error → mark as failed
                    await supabase
                        .from("scan_queue")
                        .update({
                            status: "failed",
                            error: currentRetry > 0
                                ? `Failed after ${currentRetry} retries: ${errorMessage}`
                                : errorMessage,
                            completed_at: new Date().toISOString(),
                        })
                        .eq("id", item.id);

                    // Update scan status to failed
                    await supabase
                        .from("scans")
                        .update({ status: "failed" })
                        .eq("id", item.scan_id);

                    // Increment failed_requests
                    await supabase
                        .from("zerogpt_accounts")
                        .update({
                            failed_requests: account.failed_requests + 1,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", account.id);

                    results.push({ id: item.id, scan_id: item.scan_id, status: "failed", error: errorMessage });
                }
            }
        }

        // Calculate remaining
        const totalWaiting = waitingItems.length - fairOrder.length;

        return NextResponse.json({
            processed: results.length,
            remaining: totalWaiting > 0 ? totalWaiting : 0,
            users_served: userQueues.size,
            results,
        });

    } catch (error) {
        console.error("Process queue error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
