"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ResellerData {
    company_name: string | null;
    credit_balance: number;
    referral_code: string;
}

interface Stats {
    credit_balance: number;
    total_keys: number;
    available_keys: number;
    claimed_keys: number;
}

interface Plan {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    reseller_price_monthly: number;
    scans_per_day: number;
}

interface LicenseKey {
    id: string;
    key_code: string;
    status: string;
    created_at: string;
    claimed_at: string | null;
    duration_days: number;
    plans: { name: string; slug: string } | null;
    claimed_profile: { email: string; first_name: string | null; last_name: string | null } | null;
}

export default function ResellerDashboard() {
    const { formatPrice } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [reseller, setReseller] = useState<ResellerData | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [keys, setKeys] = useState<LicenseKey[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);

    // Generate Key Form
    const [selectedPlan, setSelectedPlan] = useState("");
    const [claimHours, setClaimHours] = useState(24);
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState("");
    const [genSuccess, setGenSuccess] = useState("");

    useEffect(() => {
        async function fetchData() {
            try {
                const [profileRes, keysRes, plansRes] = await Promise.all([
                    fetch("/api/profile"),
                    fetch("/api/license-keys"),
                    fetch("/api/plans"),
                ]);

                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setReseller(data.reseller);
                    setStats(data.stats);
                }
                if (keysRes.ok) {
                    const data = await keysRes.json();
                    setKeys(data.keys || []);
                }
                if (plansRes.ok) {
                    const data = await plansRes.json();
                    const paid = (data.plans || []).filter((p: Plan) => Number(p.price_monthly) > 0);
                    setPlans(paid);
                    if (paid.length > 0) setSelectedPlan(paid[0].id);
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleGenerate = async () => {
        setGenError("");
        setGenSuccess("");
        setGenerating(true);
        try {
            const res = await fetch("/api/keys/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan_id: selectedPlan,
                    quantity: 1,
                    claim_hours: claimHours,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setGenError(data.error || "Failed to generate key");
                return;
            }
            setGenSuccess(`Key generated: ${data.keys?.[0]?.key_code || "Success"}`);
            if (data.new_balance !== undefined && reseller) {
                setReseller({ ...reseller, credit_balance: data.new_balance });
                if (stats) setStats({ ...stats, credit_balance: data.new_balance, total_keys: stats.total_keys + 1, available_keys: stats.available_keys + 1 });
            }
            // Refresh keys list
            const keysRes = await fetch("/api/license-keys");
            if (keysRes.ok) {
                const kd = await keysRes.json();
                setKeys(kd.keys || []);
            }
        } catch {
            setGenError("Failed to generate key");
        } finally {
            setGenerating(false);
        }
    };

    // Get claimed keys as "customers"
    const claimedKeys = keys.filter(k => k.status === "claimed" && k.claimed_profile);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            label: "Bulk Credit Balance",
            value: formatPrice(stats?.credit_balance || 0),
            icon: "account_balance_wallet",
            iconStyle: "text-primary bg-primary/10",
            extra: null,
        },
        {
            label: "Sub-accounts Managed",
            value: String(claimedKeys.length),
            icon: "group",
            iconStyle: "text-teal-600 bg-teal-500/10",
            extra: "Active accounts",
        },
        {
            label: "Work Purchase Keys Generated",
            value: String(stats?.total_keys || 0),
            icon: "key",
            iconStyle: "text-indigo-600 bg-indigo-500/10",
            extra: "Lifetime total",
        },
        {
            label: "Available Work Purchase Keys",
            value: String(stats?.available_keys || 0),
            icon: "check_circle",
            iconStyle: "text-orange-600 bg-orange-500/10",
            extra: "Ready to claim",
        },
    ];

    const avatarColors = [
        "bg-blue-100 text-blue-600",
        "bg-teal-100 text-teal-600",
        "bg-orange-100 text-orange-600",
        "bg-pink-100 text-pink-600",
        "bg-purple-100 text-purple-600",
    ];

    const selectedPlanData = plans.find(p => p.id === selectedPlan);

    return (
        <>
            {/* Page Header + Primary Action */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-slate-700 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                        Reseller Overview
                    </h1>
                    <p className="text-slate-500 text-base font-normal">
                        Manage your credits and sub-accounts efficiently.
                    </p>
                </div>
                <Link
                    href="/billing"
                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20 transition-all"
                >
                    <span className="material-symbols-outlined">credit_card</span>
                    <span className="truncate font-bold tracking-[0.015em]">Purchase Credits</span>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card) => (
                    <div
                        key={card.label}
                        className="flex flex-col gap-2 rounded-2xl p-6 bg-white border border-slate-100 shadow-lg shadow-slate-200/50"
                    >
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 text-sm font-medium leading-normal">
                                {card.label}
                            </p>
                            <span className={`material-symbols-outlined ${card.iconStyle} p-1.5 rounded-md`}>
                                {card.icon}
                            </span>
                        </div>
                        <p className="text-slate-700 tracking-tight text-3xl font-bold leading-tight">
                            {card.value}
                        </p>
                        {card.extra && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-1">
                                {card.extra}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Content Grid: Generate Keys + Customer Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Generate Keys Tool */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100">
                            <h2 className="text-slate-700 text-lg font-bold leading-tight flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">encrypted</span>
                                Generate Customer Work Purchase Keys
                            </h2>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            {/* Plan Type */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-500">Package</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
                                        value={selectedPlan}
                                        onChange={(e) => setSelectedPlan(e.target.value)}
                                    >
                                        {plans.map((plan) => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.name} ({formatPrice(Number(plan.reseller_price_monthly))})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>

                            {/* Key Claim Time Limit */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-500">Key Claim Time Limit</label>
                                <div className="flex gap-2">
                                    {[
                                        { label: "5 Hours", value: 5 },
                                        { label: "24 Hours", value: 24 },
                                        { label: "48 Hours", value: 48 },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setClaimHours(opt.value)}
                                            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${claimHours === opt.value
                                                ? "bg-primary/10 text-primary border border-primary/20"
                                                : "border border-slate-100 text-slate-500 hover:bg-slate-50"
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Error/Success */}
                            {genError && (
                                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{genError}</p>
                            )}
                            {genSuccess && (
                                <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                                    <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                                    <code className="text-xs text-green-700 font-mono font-medium flex-1 truncate">{genSuccess.replace("Key generated: ", "")}</code>
                                    <button
                                        onClick={() => {
                                            const key = genSuccess.replace("Key generated: ", "");
                                            navigator.clipboard.writeText(key);
                                            const btn = document.activeElement as HTMLButtonElement;
                                            const icon = btn?.querySelector("span");
                                            if (icon) { icon.textContent = "check"; setTimeout(() => { icon.textContent = "content_copy"; }, 1500); }
                                        }}
                                        className="p-1 hover:bg-green-100 rounded transition-colors"
                                        title="Copy key"
                                    >
                                        <span className="material-symbols-outlined text-green-600 text-base">content_copy</span>
                                    </button>
                                </div>
                            )}

                            <div className="h-px bg-border-light my-1"></div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerate}
                                disabled={generating || !selectedPlan}
                                className="flex w-full cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-md shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generating ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    "Generate Key"
                                )}
                            </button>

                            {/* Cost Info */}
                            {selectedPlanData && (
                                <p className="text-xs text-slate-500 text-center">
                                    Cost: {formatPrice(Number(selectedPlanData.reseller_price_monthly))}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Promo / Info Card */}
                    <div className="bg-gradient-to-br from-indigo-900 to-primary rounded-xl p-5 text-white shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-[100px]">rocket_launch</span>
                        </div>
                        <h3 className="font-bold text-lg relative z-10">New Feature Alert</h3>
                        <p className="text-indigo-100 text-sm mt-2 relative z-10">
                            Bulk key generation is now available via CSV upload in the Settings tab.
                        </p>
                        <Link
                            href="/settings"
                            className="mt-4 inline-block px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-xs font-bold transition-colors relative z-10"
                        >
                            Check Settings
                        </Link>
                    </div>
                </div>

                {/* Right Column: Customer Table */}
                <div className="lg:col-span-2 flex flex-col h-full">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 flex-1 flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-slate-700 text-lg font-bold leading-tight">My Customers</h2>
                            <Link
                                href="/keys/history"
                                className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                            >
                                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Key</th>
                                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {keys.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="material-symbols-outlined text-4xl opacity-30">vpn_key</span>
                                                    <p>No work purchase keys generated yet. Use the form to generate your first key.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        keys.slice(0, 6).map((key, idx) => {
                                            const plan = key.plans as unknown as { name: string; slug: string } | null;
                                            const claimer = key.claimed_profile as unknown as { email: string; first_name: string | null; last_name: string | null } | null;
                                            const name = claimer
                                                ? `${claimer.first_name || ""} ${claimer.last_name || ""}`.trim() || claimer.email.split("@")[0]
                                                : "Unclaimed";
                                            const email = claimer?.email || "—";
                                            const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                                            const colorClass = avatarColors[idx % avatarColors.length];

                                            const planBadgeColors: Record<string, string> = {
                                                professional: "bg-purple-100 text-purple-700",
                                                enterprise: "bg-green-100 text-green-700",
                                                starter: "bg-slate-100 text-slate-600",
                                            };
                                            const badgeColor = planBadgeColors[plan?.slug || ""] || "bg-slate-100 text-slate-600";

                                            const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
                                                available: { color: "text-blue-600", dot: "bg-blue-500", label: "Available" },
                                                claimed: { color: "text-green-600", dot: "bg-green-500", label: "Active" },
                                                expired: { color: "text-red-600", dot: "bg-red-500", label: "Expired" },
                                                revoked: { color: "text-slate-500", dot: "bg-slate-500", label: "Revoked" },
                                            };
                                            const st = statusConfig[key.status] || statusConfig.available;

                                            return (
                                                <tr key={key.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-8 w-8 rounded-full ${colorClass} flex items-center justify-center text-xs font-bold`}>
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-700">{name}</p>
                                                                <p className="text-xs text-slate-500">{email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${badgeColor}`}>
                                                            {plan?.name || "—"}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                                                            {st.label}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <code className="text-xs font-mono text-slate-500">
                                                            {key.key_code.slice(0, 14)}...
                                                        </code>
                                                    </td>
                                                    <td className="p-4 text-right text-xs text-slate-500">
                                                        {new Date(key.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {keys.length > 6 && (
                            <div className="p-4 border-t border-slate-100 flex justify-center">
                                <Link
                                    href="/keys/history"
                                    className="text-sm text-slate-500 hover:text-primary font-medium transition-colors"
                                >
                                    Load more customers...
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 mb-6 text-center text-xs text-slate-500">
                © {new Date().getFullYear()} ScopeLens Inc. All rights reserved.
            </footer>
        </>
    );
}
