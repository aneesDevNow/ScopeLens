import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || "";
const GATEWAY_API_KEY = process.env.PAYMENT_GATEWAY_API_KEY || "";

// ─── POST: Submit screenshot for verification (proxies to external gateway) ───
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Auth check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse body
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { packageId, screenshotBase64, senderName, bankName } = body;

        if (!packageId || !screenshotBase64 || !senderName || !bankName) {
            return NextResponse.json(
                { error: "Missing required fields: packageId, screenshotBase64, senderName, bankName" },
                { status: 400 }
            );
        }

        // 3. Validate package
        const { data: pkg, error: pkgError } = await supabase
            .from("credit_packages")
            .select("*")
            .eq("id", packageId)
            .single();

        if (pkgError || !pkg) {
            return NextResponse.json({ error: "Package not found" }, { status: 404 });
        }

        if (!pkg.is_active) {
            return NextResponse.json({ error: "This package is no longer active" }, { status: 400 });
        }

        // 4. Get reseller record
        const { data: reseller, error: resellerErr } = await supabase
            .from("resellers")
            .select("id, credit_balance, user_id")
            .eq("user_id", user.id)
            .single();

        if (resellerErr || !reseller) {
            return NextResponse.json({ error: "Reseller profile not found" }, { status: 404 });
        }

        // 5. Determine amount
        const amount = pkg.price_pkr || pkg.price;
        const currency = pkg.price_pkr ? "PKR" : "USD";

        // 6. Forward to external payment gateway
        if (!GATEWAY_URL || !GATEWAY_API_KEY) {
            return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
        }

        const gatewayResponse = await fetch(`${GATEWAY_URL}/api/v1/verify-payment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GATEWAY_API_KEY}`,
            },
            body: JSON.stringify({
                screenshot: screenshotBase64,
                sender_name: senderName,
                bank_name: bankName,
                expected_amount: amount,
                currency,
                package_id: packageId,
                reseller_id: reseller.id,
                metadata: {
                    package_name: pkg.name,
                    credits: pkg.credits,
                    bonus_credits: pkg.bonus_credits || 0,
                    reseller_user_id: user.id,
                },
            }),
        });

        if (!gatewayResponse.ok) {
            const errData = await gatewayResponse.json().catch(() => ({}));
            console.error("Payment gateway error:", gatewayResponse.status, errData);
            return NextResponse.json(
                { error: errData.error || "Payment gateway error" },
                { status: gatewayResponse.status }
            );
        }

        const gatewayData = await gatewayResponse.json();

        // If gateway immediately verified, credit the reseller
        if (gatewayData.status === "verified") {
            await creditReseller(supabase, reseller, pkg);
        }

        return NextResponse.json({
            success: true,
            transaction_id: gatewayData.transaction_id,
            status: gatewayData.status,
            message: gatewayData.message || "Payment screenshot submitted. Verification in progress.",
        });
    } catch (error) {
        console.error("Payment verify POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ─── GET: Poll verification status (proxies to external gateway) ────────────
export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        // Auth check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const transactionId = url.searchParams.get("transaction_id");

        if (!transactionId) {
            return NextResponse.json({ error: "Missing transaction_id" }, { status: 400 });
        }

        if (!GATEWAY_URL || !GATEWAY_API_KEY) {
            return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
        }

        // Forward poll request to external gateway
        const gatewayResponse = await fetch(
            `${GATEWAY_URL}/api/v1/verify-payment?transaction_id=${encodeURIComponent(transactionId)}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${GATEWAY_API_KEY}`,
                },
            }
        );

        if (!gatewayResponse.ok) {
            const errData = await gatewayResponse.json().catch(() => ({}));
            return NextResponse.json(
                { error: errData.error || "Failed to check status" },
                { status: gatewayResponse.status }
            );
        }

        const gatewayData = await gatewayResponse.json();

        // If newly verified, credit the reseller
        if (gatewayData.status === "verified" && !gatewayData.already_credited) {
            const { data: reseller } = await supabase
                .from("resellers")
                .select("id, credit_balance, user_id")
                .eq("user_id", user.id)
                .single();

            if (reseller && gatewayData.package_id) {
                const { data: pkg } = await supabase
                    .from("credit_packages")
                    .select("*")
                    .eq("id", gatewayData.package_id)
                    .single();

                if (pkg) {
                    await creditReseller(supabase, reseller, pkg);
                    // Mark as credited on gateway side
                    await fetch(`${GATEWAY_URL}/api/v1/verify-payment`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${GATEWAY_API_KEY}`,
                        },
                        body: JSON.stringify({
                            transaction_id: transactionId,
                            credited: true,
                        }),
                    }).catch(() => { });
                }
            }
        }

        return NextResponse.json({
            transaction_id: gatewayData.transaction_id,
            status: gatewayData.status,
            verified_at: gatewayData.verified_at,
            message: gatewayData.message,
        });
    } catch (error) {
        console.error("Payment verify GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ─── Helper: Credit reseller after verified payment ─────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function creditReseller(supabase: any, reseller: any, pkg: any) {
    const totalCredits = pkg.credits + (pkg.bonus_credits || 0);
    const newBalance = (reseller.credit_balance || 0) + totalCredits;

    // Record the transaction
    const { error: txError } = await supabase
        .from("reseller_transactions")
        .insert({
            reseller_id: reseller.id,
            type: "credit_purchase",
            amount: totalCredits,
            balance_after: newBalance,
            description: `Bank transfer verified: ${pkg.name} — ${pkg.credits} credits${pkg.bonus_credits > 0 ? ` + ${pkg.bonus_credits} bonus` : ""}`,
            created_by: reseller.user_id || reseller.id,
        });

    if (txError) {
        console.error("Transaction insert error after verification:", txError);
        return;
    }

    // Update reseller balance
    const { error: updateErr } = await supabase
        .from("resellers")
        .update({ credit_balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", reseller.id);

    if (updateErr) {
        console.error("Balance update error after verification:", updateErr);
    }
}
