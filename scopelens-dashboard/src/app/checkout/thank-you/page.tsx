"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Plan {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    scans_per_day: number;
}

function ScopeLensLogo() {
    return (
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-5 h-5">
                <circle cx="100" cy="88" r="45" fill="none" stroke="white" strokeWidth="8" opacity="0.95" />
                <circle cx="100" cy="88" r="32" fill="none" stroke="white" strokeWidth="4" opacity="0.7" />
                <circle cx="92" cy="80" r="8" fill="white" opacity="0.4" />
                <line x1="70" y1="78" x2="130" y2="78" stroke="white" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
                <line x1="75" y1="88" x2="125" y2="88" stroke="white" strokeWidth="3" opacity="0.8" strokeLinecap="round" />
                <line x1="70" y1="98" x2="130" y2="98" stroke="white" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
                <rect x="132" y="118" width="14" height="45" rx="7" fill="white" opacity="0.95" transform="rotate(45, 139, 140)" />
            </svg>
        </div>
    );
}

function ThankYouContent() {
    const searchParams = useSearchParams();
    const planSlug = searchParams.get("plan");
    const { formatPrice } = useCurrency();

    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlan();
    }, [planSlug]);

    const fetchPlan = async () => {
        if (!planSlug) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch("/api/plans");
            if (res.ok) {
                const data = await res.json();
                const found = data.plans.find((p: Plan) => p.slug === planSlug);
                setPlan(found || null);
            }
        } catch (error) {
            console.error("Error fetching plan:", error);
        } finally {
            setLoading(false);
        }
    };

    const tax = plan ? plan.price_monthly * 0.1 : 0;
    const total = plan ? plan.price_monthly + tax : 0;
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    const orderNumber = `SL-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Top Navbar */}
            <nav className="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <ScopeLensLogo />
                        <span className="text-lg font-bold text-slate-700">Scope Lens</span>
                    </Link>
                    <div className="flex items-center gap-1.5 text-green-600 text-xs">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Payment Complete</span>
                    </div>
                </div>
            </nav>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto flex items-center justify-center py-8">
                <div className="max-w-md w-full px-6">
                    {/* Progress Bar - Complete */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-green-600">Order Complete</span>
                            <span className="text-xs text-slate-500">Step 3 of 3</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: "100%" }}></div>
                        </div>
                    </div>

                    {/* Success Card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
                        {/* Success Icon */}
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-slate-700 mb-1">Payment Successful!</h1>
                        <p className="text-sm text-slate-500 mb-6">
                            Thank you for subscribing to {plan?.name || "ScopeLens"}
                        </p>

                        {/* Order Number */}
                        <div className="bg-slate-50 rounded-lg p-3 mb-5">
                            <p className="text-xs text-slate-500 mb-0.5">Order Number</p>
                            <p className="font-mono font-bold text-sm text-slate-700">{orderNumber}</p>
                        </div>

                        {/* Order Details */}
                        <div className="space-y-2 text-sm mb-6">
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">Plan</span>
                                <span className="font-medium text-slate-700">{plan?.name || "Pro Plan"}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">Daily Scans</span>
                                <span className="font-medium text-slate-700">{plan?.scans_per_day?.toLocaleString() || "Unlimited"}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">Amount Paid</span>
                                <span className="font-medium text-green-600">{formatPrice(total)}</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-slate-500">Next Billing</span>
                                <span className="font-medium text-slate-700">
                                    {nextBillingDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2.5">
                            <Link
                                href="/"
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                            >
                                Start Scanning
                            </Link>
                            <Link
                                href="/settings"
                                className="w-full py-2.5 bg-slate-100 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                Manage Subscription
                            </Link>
                        </div>
                    </div>

                    {/* Help Text */}
                    <p className="text-center text-xs text-slate-400 mt-5">
                        A confirmation email has been sent to your inbox.
                        <br />
                        Need help? <Link href="/settings" className="text-blue-600 hover:underline">Contact Support</Link>
                    </p>
                </div>
            </div>

            {/* Footer */}
            <footer className="text-center text-xs text-slate-400 py-3 border-t border-slate-100 flex-shrink-0">
                © {new Date().getFullYear()} Scope Lens. All rights reserved.
            </footer>
        </div>
    );
}

export default function ThankYouPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-500">Loading...</p>
                </div>
            </div>
        }>
            <ThankYouContent />
        </Suspense>
    );
}
