"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface ResellerProfile {
    id: string;
    credit_balance: number;
    company_name: string | null;
}

function ThankYouContent() {
    const searchParams = useSearchParams();
    const amount = parseInt(searchParams.get("amount") || "0");
    const bonus = parseInt(searchParams.get("bonus") || "0");

    const [profile, setProfile] = useState<ResellerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/reseller/profile");
            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalCredits = amount + bonus;
    const transactionId = `RC-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

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

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Credits Added!</h1>
                    <p className="text-gray-500 mb-8">
                        Your purchase was successful
                    </p>

                    {/* Transaction ID */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                        <p className="font-mono font-bold text-gray-900">{transactionId}</p>
                    </div>

                    {/* Credit Details */}
                    <div className="space-y-3 text-sm mb-6">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Credits Purchased</span>
                            <span className="font-medium text-gray-900">${amount.toLocaleString()}</span>
                        </div>
                        {bonus > 0 && (
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-green-600">Bonus Credits</span>
                                <span className="font-medium text-green-600">+${bonus.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Total Added</span>
                            <span className="font-bold text-blue-600">${totalCredits.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* New Balance */}
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 mb-8">
                        <p className="text-sm text-blue-600 mb-1">Your New Balance</p>
                        <p className="text-4xl font-bold text-blue-600">
                            ${profile?.credit_balance?.toLocaleString() || "0"}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Link
                            href="/reseller/clients?action=add"
                            className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">person_add</span>
                            Add New Client
                        </Link>
                        <Link
                            href="/reseller/dashboard"
                            className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">dashboard</span>
                            Go to Dashboard
                        </Link>
                    </div>
                </div>

                {/* Help Text */}
                <p className="text-center text-sm text-gray-400 mt-6">
                    A receipt has been sent to your email.
                    <br />
                    <Link href="/reseller/billing" className="text-blue-600 hover:underline">View Transaction History</Link>
                </p>
            </div>
        </div>
    );
}

export default function ResellerThankYouPage() {
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
