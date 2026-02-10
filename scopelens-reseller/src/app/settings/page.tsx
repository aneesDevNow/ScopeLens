"use client";

import { useState, useEffect } from "react";

interface ResellerData {
    company_name: string;
    referral_code: string;
    commission_rate: number;
    status: string;
    credit_balance: number;
    total_revenue: number;
    total_commission: number;
    created_at: string;
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [reseller, setReseller] = useState<ResellerData | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setReseller(data.reseller);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const copyReferralCode = async () => {
        if (reseller?.referral_code) {
            await navigator.clipboard.writeText(reseller.referral_code);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-slate-700 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                    Settings
                </h1>
                <p className="text-slate-500 text-base font-normal">
                    Manage your reseller account
                </p>
            </div>

            <div className="space-y-6">
                {/* Account Info */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                        <h2 className="text-slate-700 text-lg font-bold leading-tight">Account Information</h2>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Company Name</span>
                            <span className="font-medium text-slate-700">{reseller?.company_name || "—"}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Status</span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${reseller?.status === "active" ? "text-green-600" :
                                    reseller?.status === "pending" ? "text-yellow-600" : "text-red-600"
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${reseller?.status === "active" ? "bg-green-500" :
                                        reseller?.status === "pending" ? "bg-yellow-500" : "bg-red-500"
                                    }`}></span>
                                {reseller?.status?.charAt(0).toUpperCase() + (reseller?.status?.slice(1) || "")}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Commission Rate</span>
                            <span className="font-medium text-slate-700">{reseller?.commission_rate || 0}%</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-sm text-slate-500">Member Since</span>
                            <span className="font-medium text-slate-700">
                                {reseller?.created_at ? new Date(reseller.created_at).toLocaleDateString() : "—"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Referral Code */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                        <h2 className="text-slate-700 text-lg font-bold leading-tight">Referral Code</h2>
                    </div>
                    <div className="p-5">
                        <p className="text-sm text-slate-500 mb-4">Share this code to track referrals</p>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
                                <code className="font-mono text-lg font-bold text-slate-700">{reseller?.referral_code}</code>
                            </div>
                            <button
                                onClick={copyReferralCode}
                                className="h-10 px-5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-md shadow-primary/20 transition-all flex items-center gap-2 text-sm"
                            >
                                <span className="material-symbols-outlined text-lg">{copiedCode ? "check" : "content_copy"}</span>
                                {copiedCode ? "Copied" : "Copy"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
