"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Plan {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    price_yearly: number;
    scans_per_month: number;
    features: string[];
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

export default function PlansPage() {
    const [data, setData] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSubscription() {
            try {
                const res = await fetch("/api/subscription");
                if (res.ok) {
                    const subData = await res.json();
                    setData(subData);
                }
            } catch (err) {
                console.error("Error fetching subscription:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchSubscription();
    }, []);

    const currentPlan = data?.plan?.slug || "free";
    const scansUsed = data?.usage?.scans_used || 0;
    const scansLimit = data?.usage?.scans_limit || 50;
    const scansRemaining = scansLimit - scansUsed;
    const usagePercent = scansLimit > 0 ? Math.round((scansUsed / scansLimit) * 100) : 0;

    const renewalDate = data?.subscription?.current_period_end
        ? new Date(data.subscription.current_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "N/A";

    const plans = [
        {
            slug: "student",
            name: "Student",
            price: 0,
            features: ["50 Scans/mo", "Basic Analysis", "Email Support"],
        },
        {
            slug: "professional",
            name: "Professional",
            price: 12,
            features: ["Unlimited Scans", "Deep Analysis AI", "Priority Support", "Plagiarism Check"],
            popular: true,
        },
        {
            slug: "institution",
            name: "Institution",
            price: 299,
            features: ["API Access", "SSO Integration", "Dedicated Account Manager", "Team Management"],
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Plan & Usage</h1>
                <p className="text-gray-500 mb-8">Manage your subscription and track your scan usage for the current billing cycle.</p>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {/* Scans Remaining Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-600 font-medium">Scans Remaining</span>
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-4xl font-bold text-gray-900">{loading ? "..." : scansRemaining}</span>
                            <span className="text-gray-400 text-lg">/ {scansLimit}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Usage</span>
                                <span>{usagePercent}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                    style={{ width: `${usagePercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Words Analyzed Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-600 font-medium">Words Analyzed</span>
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-4xl font-bold text-gray-900 mb-2">24,500</div>
                        <p className="text-gray-400 text-sm">Total lifetime words scanned</p>
                    </div>

                    {/* Plan Renewal Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-600 font-medium">Plan Renewal</span>
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-4xl font-bold text-gray-900 mb-2">{renewalDate}</div>
                        <p className="text-gray-400 text-sm">Next billing date</p>
                    </div>
                </div>

                {/* Upgrade Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade your plan</h2>
                    <p className="text-gray-500 mb-6">Unlock deeper analysis and higher scan limits.</p>
                </div>

                {/* Plan Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const isCurrentPlan = plan.slug === currentPlan || (currentPlan === "free" && plan.slug === "student");

                        return (
                            <div
                                key={plan.slug}
                                className={`bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isCurrentPlan ? "border-blue-500" : "border-gray-100"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                                    {isCurrentPlan && (
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase">
                                            Current Plan
                                        </span>
                                    )}
                                    {plan.popular && !isCurrentPlan && (
                                        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full uppercase">
                                            Popular
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                                    <span className="text-gray-400">/mo</span>
                                </div>

                                {isCurrentPlan ? (
                                    <button
                                        disabled
                                        className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-400 font-medium mb-6 cursor-not-allowed"
                                    >
                                        Active
                                    </button>
                                ) : plan.slug === "institution" ? (
                                    <button className="w-full py-3 px-4 rounded-xl border-2 border-gray-300 text-gray-700 font-medium mb-6 hover:bg-gray-50 transition-colors">
                                        Contact Sales
                                    </button>
                                ) : (
                                    <Link href={`/checkout?plan=${plan.slug}`} className="block mb-6">
                                        <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25">
                                            Upgrade Now
                                        </button>
                                    </Link>
                                )}

                                <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-gray-600">
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
            </div>
        </div>
    );
}
