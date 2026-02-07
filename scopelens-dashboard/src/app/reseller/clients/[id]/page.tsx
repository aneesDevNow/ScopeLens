"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Client {
    id: string;
    client_name: string;
    client_email: string;
    status: "active" | "expired" | "cancelled" | "pending";
    retail_price: number;
    reseller_cost: number;
    profit: number;
    billing_cycle: string;
    expires_at: string;
    created_at: string;
    plan_id: string;
    plans?: { name: string };
    license_key?: string;
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchClient();
    }, [id]);

    const fetchClient = async () => {
        try {
            const res = await fetch(`/api/reseller/clients/${id}`);
            if (res.ok) {
                const data = await res.json();
                setClient(data.client);
            }
        } catch (error) {
            console.error("Error fetching client:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRenew = async () => {
        if (!client) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/reseller/clients/${id}/renew`, { method: "POST" });
            if (res.ok) {
                await fetchClient();
            }
        } catch (error) {
            console.error("Error renewing:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this subscription?")) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/reseller/clients/${id}/cancel`, { method: "POST" });
            if (res.ok) {
                await fetchClient();
            }
        } catch (error) {
            console.error("Error cancelling:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const copyLicenseKey = () => {
        if (client?.license_key) {
            navigator.clipboard.writeText(client.license_key);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const daysUntilExpiry = client
        ? Math.ceil((new Date(client.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading client details...</p>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="p-8">
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-gray-400 text-4xl">person_off</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Client not found</h3>
                    <p className="text-gray-500 mb-6">This client may have been deleted or doesn't exist.</p>
                    <Link href="/reseller/clients" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl">
                        Back to Clients
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link href="/reseller/clients" className="hover:text-gray-900 flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Clients
                </Link>
                <span>/</span>
                <span className="text-gray-900">{client.client_name}</span>
            </nav>

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-purple-500/25">
                        {client.client_name[0]}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{client.client_name}</h1>
                        <p className="text-gray-500 mt-1">{client.client_email}</p>
                        <div className="mt-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${client.status === "active" ? "bg-green-100 text-green-700" :
                                    client.status === "expired" ? "bg-red-100 text-red-700" :
                                        client.status === "cancelled" ? "bg-gray-100 text-gray-700" :
                                            "bg-amber-100 text-amber-700"
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${client.status === "active" ? "bg-green-500" :
                                        client.status === "expired" ? "bg-red-500" :
                                            client.status === "cancelled" ? "bg-gray-500" :
                                                "bg-amber-500"
                                    }`}></span>
                                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {client.status === "active" && (
                        <button
                            onClick={handleCancel}
                            disabled={actionLoading}
                            className="px-5 py-2.5 text-red-600 font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                            Cancel Subscription
                        </button>
                    )}
                    {(client.status === "active" || client.status === "expired") && (
                        <button
                            onClick={handleRenew}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-lg">autorenew</span>
                            Renew
                        </button>
                    )}
                </div>
            </div>

            {/* Expiry Alert */}
            {client.status === "active" && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
                <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-600">schedule</span>
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-amber-800">Subscription expires in {daysUntilExpiry} day{daysUntilExpiry > 1 ? 's' : ''}</p>
                        <p className="text-sm text-amber-600">Renew now to avoid service interruption</p>
                    </div>
                    <button onClick={handleRenew} className="px-4 py-2 bg-amber-100 text-amber-700 font-medium rounded-lg hover:bg-amber-200 transition-colors">
                        Renew Now
                    </button>
                </div>
            )}

            {/* Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Subscription Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">Plan</p>
                                    <p className="font-semibold text-gray-900">{client.plans?.name || "Unknown Plan"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Billing Cycle</p>
                                    <p className="font-semibold text-gray-900 capitalize">{client.billing_cycle}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Next Billing Date</p>
                                    <p className="font-semibold text-gray-900">{new Date(client.expires_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">Retail Price</p>
                                    <p className="font-semibold text-gray-900">${client.retail_price}/{client.billing_cycle === "monthly" ? "mo" : "yr"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Your Cost</p>
                                    <p className="font-semibold text-purple-600">${client.reseller_cost}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Created</p>
                                    <p className="font-semibold text-gray-900">{new Date(client.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* License Key */}
                    {client.license_key && (
                        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">License Key</h2>
                            <div className="flex items-center gap-3">
                                <code className="flex-1 px-4 py-3 bg-gray-100 rounded-xl font-mono text-sm overflow-x-auto">
                                    {client.license_key}
                                </code>
                                <button
                                    onClick={copyLicenseKey}
                                    className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                    title="Copy to clipboard"
                                >
                                    <span className="material-symbols-outlined text-gray-600">
                                        {copied ? "check" : "content_copy"}
                                    </span>
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-3">Share this license key with your client to activate their subscription.</p>
                        </div>
                    )}
                </div>

                {/* Profit Card */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl shadow-green-500/25 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl">trending_up</span>
                                </div>
                                <span className="text-sm opacity-80">Your Profit</span>
                            </div>
                            <div className="text-4xl font-bold">+${client.profit}</div>
                            <p className="mt-2 text-sm opacity-80">per {client.billing_cycle === "monthly" ? "month" : "year"}</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
                                <span className="material-symbols-outlined text-gray-400">mail</span>
                                <span className="text-gray-700">Send Renewal Reminder</span>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
                                <span className="material-symbols-outlined text-gray-400">receipt_long</span>
                                <span className="text-gray-700">View Invoice</span>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
                                <span className="material-symbols-outlined text-gray-400">upgrade</span>
                                <span className="text-gray-700">Upgrade Plan</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
