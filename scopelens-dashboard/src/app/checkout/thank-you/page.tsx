"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Plan {
    id: string;
    name: string;
    price: number;
    scan_limit: number;
}

function ThankYouContent() {
    const searchParams = useSearchParams();
    const planId = searchParams.get("plan");

    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlan();
    }, [planId]);

    const fetchPlan = async () => {
        if (!planId) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`/api/plans/${planId}`);
            if (res.ok) {
                const data = await res.json();
                setPlan(data.plan);
            }
        } catch (error) {
            console.error("Error fetching plan:", error);
        } finally {
            setLoading(false);
        }
    };

    const tax = plan ? plan.price * 0.1 : 0;
    const total = plan ? plan.price + tax : 0;
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    const orderNumber = `SL-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 flex items-center justify-center min-h-[80vh]">
            <div className="max-w-md w-full">
                {/* Success Card */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-8 text-center">
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-green-600 text-5xl">check_circle</span>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                    <p className="text-gray-500 mb-8">
                        Thank you for subscribing to {plan?.name || "ScopeLens"}
                    </p>

                    {/* Order Number */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-500 mb-1">Order Number</p>
                        <p className="font-mono font-bold text-gray-900">{orderNumber}</p>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-3 text-sm mb-8">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Plan</span>
                            <span className="font-medium text-gray-900">{plan?.name || "Pro Plan"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Monthly Scans</span>
                            <span className="font-medium text-gray-900">{plan?.scan_limit?.toLocaleString() || "Unlimited"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Amount Paid</span>
                            <span className="font-medium text-green-600">${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-500">Next Billing Date</span>
                            <span className="font-medium text-gray-900">
                                {nextBillingDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Link
                            href="/"
                            className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">rocket_launch</span>
                            Start Scanning
                        </Link>
                        <Link
                            href="/settings/subscription"
                            className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">settings</span>
                            Manage Subscription
                        </Link>
                    </div>
                </div>

                {/* Help Text */}
                <p className="text-center text-sm text-gray-400 mt-6">
                    A confirmation email has been sent to your inbox.
                    <br />
                    Need help? <Link href="/settings" className="text-blue-600 hover:underline">Contact Support</Link>
                </p>
            </div>
        </div>
    );
}

export default function ThankYouPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        }>
            <ThankYouContent />
        </Suspense>
    );
}
