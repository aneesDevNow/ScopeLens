"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Plan {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    price_yearly: number;
    scans_per_day: number;
    features: string[];
    is_popular?: boolean;
}

interface Subscription {
    id: string;
    status: string;
    current_period_end: string;
}

interface SubscriptionData {
    subscription: Subscription | null;
    plan: Plan | null;
    usage: {
        scans_used: number;
        scans_limit: number;
    };
}

interface ScanStats {
    total_words_analyzed: number;
    total_scans: number;
    completed_scans: number;
    avg_ai_score: number;
}

export default function PlansPage() {
    const [data, setData] = useState<SubscriptionData | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [stats, setStats] = useState<ScanStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [claimKey, setClaimKey] = useState("");
    const [claiming, setClaiming] = useState(false);
    const [claimMessage, setClaimMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleClaimKey = async () => {
        if (!claimKey.trim()) return;
        setClaiming(true);
        setClaimMessage(null);
        try {
            const res = await fetch("/api/claim-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key_code: claimKey.trim() }),
            });
            const result = await res.json();
            if (res.ok) {
                setClaimMessage({ type: "success", text: result.message });
                setClaimKey("");
                // Refresh subscription data
                const subRes = await fetch("/api/subscription");
                if (subRes.ok) setData(await subRes.json());
            } else {
                setClaimMessage({ type: "error", text: result.error || "Failed to claim key" });
            }
        } catch {
            setClaimMessage({ type: "error", text: "Network error. Please try again." });
        } finally {
            setClaiming(false);
        }
    };

    useEffect(() => {
        async function fetchData() {
            try {
                const [subRes, plansRes, statsRes] = await Promise.all([
                    fetch("/api/subscription"),
                    fetch("/api/plans"),
                    fetch("/api/scans/stats"),
                ]);

                if (subRes.ok) {
                    const subData = await subRes.json();
                    setData(subData);
                }

                if (plansRes.ok) {
                    const plansData = await plansRes.json();
                    setPlans(plansData.plans || []);
                }

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const currentPlan = data?.plan?.slug || "free";
    const scansUsed = data?.usage?.scans_used || 0;
    const scansLimit = data?.usage?.scans_limit || 50;
    const scansRemaining = scansLimit - scansUsed;
    const usagePercent = scansLimit > 0 ? Math.round((scansUsed / scansLimit) * 100) : 0;

    const renewalDate = data?.subscription?.current_period_end
        ? new Date(data.subscription.current_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "N/A";

    const totalWords = stats?.total_words_analyzed || 0;
    const formatWordCount = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    const parseFeatures = (features: unknown): string[] => {
        if (!features) return [];
        if (Array.isArray(features)) return features;
        if (typeof features === "object") {
            // DB stores as {"Feature Name": true, ...}
            return Object.keys(features as Record<string, boolean>);
        }
        if (typeof features === "string") {
            try {
                const parsed = JSON.parse(features);
                if (Array.isArray(parsed)) return parsed;
                if (typeof parsed === "object" && parsed !== null) {
                    return Object.keys(parsed);
                }
            } catch {
                return features.split(",").map(f => f.trim()).filter(Boolean);
            }
        }
        return [];
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-700 mb-2">Plan & Usage</h1>
                <p className="text-slate-500 mb-8">Manage your subscription and track your scan usage for the current billing cycle.</p>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {/* Scans Remaining Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-500 font-medium">Scans Remaining</span>
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-4xl font-bold text-slate-700">{loading ? "..." : scansRemaining}</span>
                            <span className="text-slate-400 text-lg">/ {scansLimit}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Usage</span>
                                <span>{usagePercent}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                    style={{ width: `${usagePercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Words Analyzed Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-500 font-medium">Words Analyzed</span>
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-4xl font-bold text-slate-700 mb-2">{loading ? "..." : formatWordCount(totalWords)}</div>
                        <p className="text-slate-400 text-sm">Total lifetime words scanned</p>
                    </div>

                    {/* Plan Renewal Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-500 font-medium">Plan Renewal</span>
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-4xl font-bold text-slate-700 mb-2">{renewalDate}</div>
                        <p className="text-slate-400 text-sm">Next billing date</p>
                    </div>
                </div>

                {/* Claim Key Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-100 mb-12">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-700 mb-1">Have a License Key?</h3>
                            <p className="text-slate-500 text-sm mb-4">Enter your license key to activate a subscription plan.</p>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="SL-XXXXX-XXXXX-XXXXX-XXXXX"
                                    className="flex-1 px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm tracking-wider uppercase shadow-sm"
                                    value={claimKey}
                                    onChange={(e) => { setClaimKey(e.target.value); setClaimMessage(null); }}
                                    onKeyDown={(e) => e.key === "Enter" && handleClaimKey()}
                                    maxLength={26}
                                />
                                <button
                                    onClick={handleClaimKey}
                                    disabled={claiming || !claimKey.trim()}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {claiming ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Claiming...
                                        </>
                                    ) : (
                                        "Activate Key"
                                    )}
                                </button>
                            </div>
                            {claimMessage && (
                                <div className={`mt-3 p-3 rounded-xl text-sm font-medium ${claimMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                    {claimMessage.text}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Upgrade Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-700 mb-2">Upgrade your plan</h2>
                    <p className="text-slate-500 mb-6">Unlock deeper analysis and higher scan limits.</p>
                </div>

                {/* Plan Cards */}
                {loading ? (
                    <div className="text-center py-12 text-slate-400">Loading plans...</div>
                ) : plans.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">No plans available.</div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                            const isCurrentPlan = plan.slug === currentPlan || (currentPlan === "free" && plan.slug === "free");

                            return (
                                <div
                                    key={plan.slug}
                                    className={`bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isCurrentPlan ? "border-blue-500" : "border-slate-100"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-semibold text-slate-700">{plan.name}</h3>
                                        {isCurrentPlan && (
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase">
                                                Current Plan
                                            </span>
                                        )}
                                        {plan.is_popular && !isCurrentPlan && (
                                            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full uppercase">
                                                Popular
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-4xl font-bold text-slate-700">${plan.price_monthly}</span>
                                        <span className="text-slate-400">/mo</span>
                                    </div>

                                    {isCurrentPlan ? (
                                        <button
                                            disabled
                                            className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-400 font-medium mb-6 cursor-not-allowed"
                                        >
                                            Active
                                        </button>
                                    ) : (
                                        <Link href={`/checkout?plan=${plan.slug}`} className="block mb-6">
                                            <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25">
                                                Upgrade Now
                                            </button>
                                        </Link>
                                    )}

                                    <ul className="space-y-3">
                                        {parseFeatures(plan.features).map((feature, i) => (
                                            <li key={i} className="flex items-center gap-3 text-slate-500">
                                                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
