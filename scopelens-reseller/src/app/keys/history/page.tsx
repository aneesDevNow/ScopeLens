"use client";

import { useState, useEffect } from "react";

interface LicenseKey {
    id: string;
    key_code: string;
    status: string;
    duration_days: number;
    batch_id: string;
    claimed_at: string | null;
    expires_at: string | null;
    created_at: string;
    plans: { name: string; slug: string; price_monthly: number; reseller_price_monthly: number } | null;
    claimed_profile: { email: string; first_name: string | null; last_name: string | null } | null;
}

export default function KeyHistoryPage() {
    const [keys, setKeys] = useState<LicenseKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        fetchKeys();
    }, [filter]);

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const url = filter === "all" ? "/api/license-keys" : `/api/license-keys?status=${filter}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setKeys(data.keys || []);
            }
        } catch (err) {
            console.error("Error fetching keys:", err);
        } finally {
            setLoading(false);
        }
    };

    const copyKey = async (keyCode: string) => {
        await navigator.clipboard.writeText(keyCode);
        setCopiedKey(keyCode);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const statusCounts = keys.reduce((acc, key) => {
        acc[key.status] = (acc[key.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const filters = [
        { label: "All", value: "all", count: keys.length },
        { label: "Available", value: "available", count: statusCounts["available"] || 0 },
        { label: "Claimed", value: "claimed", count: statusCounts["claimed"] || 0 },
        { label: "Expired", value: "expired", count: statusCounts["expired"] || 0 },
        { label: "Revoked", value: "revoked", count: statusCounts["revoked"] || 0 },
    ];

    const avatarColors = [
        "bg-blue-100 text-blue-600",
        "bg-teal-100 text-teal-600",
        "bg-orange-100 text-orange-600",
        "bg-pink-100 text-pink-600",
        "bg-purple-100 text-purple-600",
    ];

    return (
        <>
            {/* Header */}
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-text-light text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                    My Customers
                </h1>
                <p className="text-text-secondary-light text-base font-normal">
                    Track all your generated license keys and their claim status
                </p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {filters.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.value
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-surface-light text-text-secondary-light border border-border-light hover:bg-background-light"
                            }`}
                    >
                        {f.label} <span className="ml-1 opacity-70">({f.count})</span>
                    </button>
                ))}
            </div>

            {/* Keys Table */}
            <div className="bg-surface-light rounded-xl border border-border-light shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-text-secondary-light">Loading keys...</p>
                    </div>
                ) : keys.length === 0 ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-4xl text-text-secondary-light/30 mb-2">vpn_key</span>
                        <p className="text-text-secondary-light">No keys found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background-light border-b border-border-light">
                                    <th className="p-4 text-xs font-semibold text-text-secondary-light uppercase tracking-wider">Customer</th>
                                    <th className="p-4 text-xs font-semibold text-text-secondary-light uppercase tracking-wider">Plan</th>
                                    <th className="p-4 text-xs font-semibold text-text-secondary-light uppercase tracking-wider">Key Code</th>
                                    <th className="p-4 text-xs font-semibold text-text-secondary-light uppercase tracking-wider">Duration</th>
                                    <th className="p-4 text-xs font-semibold text-text-secondary-light uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-semibold text-text-secondary-light uppercase tracking-wider">Created</th>
                                    <th className="p-4 text-xs font-semibold text-text-secondary-light uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {keys.map((key, idx) => {
                                    const plan = key.plans as unknown as { name: string; slug: string } | null;
                                    const claimer = key.claimed_profile as unknown as { email: string; first_name: string | null; last_name: string | null } | null;
                                    const name = claimer
                                        ? `${claimer.first_name || ""} ${claimer.last_name || ""}`.trim() || claimer.email.split("@")[0]
                                        : "Unclaimed";
                                    const email = claimer?.email || "—";
                                    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                                    const colorClass = avatarColors[idx % avatarColors.length];

                                    const planColors: Record<string, string> = {
                                        professional: "bg-purple-100 text-purple-700",
                                        enterprise: "bg-green-100 text-green-700",
                                        starter: "bg-gray-100 text-gray-700",
                                    };
                                    const badgeColor = planColors[plan?.slug || ""] || "bg-gray-100 text-gray-700";

                                    const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
                                        available: { color: "text-blue-600", dot: "bg-blue-500", label: "Available" },
                                        claimed: { color: "text-green-600", dot: "bg-green-500", label: "Active" },
                                        expired: { color: "text-red-600", dot: "bg-red-500", label: "Expired" },
                                        revoked: { color: "text-gray-600", dot: "bg-gray-500", label: "Revoked" },
                                    };
                                    const st = statusConfig[key.status] || statusConfig.available;

                                    return (
                                        <tr key={key.id} className="hover:bg-background-light transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-full ${colorClass} flex items-center justify-center text-xs font-bold`}>
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-text-light">{name}</p>
                                                        <p className="text-xs text-text-secondary-light">{email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${badgeColor}`}>
                                                    {plan?.name || "—"}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <code className="text-xs font-mono text-text-secondary-light">{key.key_code}</code>
                                            </td>
                                            <td className="p-4 text-sm text-text-secondary-light">{key.duration_days} days</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-text-secondary-light">
                                                {new Date(key.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                {key.status === "available" && (
                                                    <button onClick={() => copyKey(key.key_code)} className="p-1.5 rounded-lg hover:bg-border-light text-text-secondary-light hover:text-primary transition-colors">
                                                        <span className="material-symbols-outlined text-[20px]">{copiedKey === key.key_code ? "check" : "content_copy"}</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
