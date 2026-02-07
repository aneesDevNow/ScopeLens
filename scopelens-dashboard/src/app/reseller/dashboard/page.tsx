"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ResellerProfile {
    id: string;
    credit_balance: number;
    total_spent: number;
    commission_earned: number;
    is_active: boolean;
}

interface Client {
    id: string;
    client_name: string;
    client_email: string;
    status: "active" | "expired" | "cancelled" | "pending";
    retail_price: number;
    profit: number;
    billing_cycle: string;
    expires_at: string;
    plans?: { name: string };
}

interface Transaction {
    id: string;
    type: string;
    amount: number;
    description: string;
    created_at: string;
}

export default function ResellerDashboardPage() {
    const [profile, setProfile] = useState<ResellerProfile | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, clientsRes, transactionsRes] = await Promise.all([
                fetch("/api/reseller/profile"),
                fetch("/api/reseller/clients"),
                fetch("/api/reseller/transactions"),
            ]);

            if (profileRes.ok) {
                const data = await profileRes.json();
                setProfile(data.profile);
                // Update sidebar credit balance
                const el = document.getElementById("sidebar-credit-balance");
                if (el) el.textContent = `$${data.profile?.credit_balance?.toLocaleString() || "0"}`;
            }
            if (clientsRes.ok) {
                const data = await clientsRes.json();
                setClients(data.clients || []);
            }
            if (transactionsRes.ok) {
                const data = await transactionsRes.json();
                setTransactions(data.transactions?.slice(0, 5) || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const activeClients = clients.filter((c) => c.status === "active");
    const expiringClients = clients.filter((c) => {
        const expires = new Date(c.expires_at);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return c.status === "active" && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    });
    const totalProfit = clients.reduce((sum, c) => sum + c.profit, 0);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back! Here&apos;s your reseller overview.</p>
                </div>
                <Link
                    href="/reseller/clients?action=add"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
                >
                    <span className="material-symbols-outlined">person_add</span>
                    Add Client
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                {/* Credit Balance */}
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 font-medium">Credit Balance</span>
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600">account_balance_wallet</span>
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">${profile?.credit_balance?.toLocaleString() || "0"}</div>
                    <Link href="/reseller/billing" className="text-blue-600 text-sm font-medium hover:underline">Add credits →</Link>
                </div>

                {/* Active Clients */}
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 font-medium">Active Clients</span>
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-600">people</span>
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">{activeClients.length}</div>
                    <p className="text-gray-400 text-sm">{clients.length} total clients</p>
                </div>

                {/* Total Spent */}
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 font-medium">Total Spent</span>
                        <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-purple-600">payments</span>
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">${profile?.total_spent?.toLocaleString() || "0"}</div>
                    <p className="text-gray-400 text-sm">On client activations</p>
                </div>

                {/* Total Profit */}
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 font-medium">Total Profit</span>
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-600">trending_up</span>
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-green-600 mb-1">${totalProfit.toLocaleString()}</div>
                    <p className="text-gray-400 text-sm">Commission earned</p>
                </div>
            </div>

            {/* Alerts */}
            {(expiringClients.length > 0 || (profile?.credit_balance ?? 0) < 50) && (
                <div className="space-y-3 mb-8">
                    {expiringClients.length > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-amber-600">schedule</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-amber-800">{expiringClients.length} client{expiringClients.length > 1 ? 's' : ''} expiring soon</p>
                                <p className="text-sm text-amber-600">Consider renewing to avoid service interruption</p>
                            </div>
                            <Link href="/reseller/clients?filter=expiring" className="px-4 py-2 bg-amber-100 text-amber-700 font-medium rounded-lg hover:bg-amber-200 transition-colors">
                                View Clients
                            </Link>
                        </div>
                    )}
                    {(profile?.credit_balance ?? 0) < 50 && (
                        <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-600">warning</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-red-800">Low credit balance</p>
                                <p className="text-sm text-red-600">Add credits to continue activating clients</p>
                            </div>
                            <Link href="/reseller/billing" className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors">
                                Add Credits
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Link href="/reseller/clients?action=add" className="group p-6 bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                        <span className="material-symbols-outlined text-blue-600 text-2xl">person_add</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Add New Client</h3>
                    <p className="text-sm text-gray-500 mt-1">Create a subscription for a new client</p>
                </Link>
                <Link href="/reseller/billing" className="group p-6 bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                        <span className="material-symbols-outlined text-green-600 text-2xl">add_card</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Buy Credits</h3>
                    <p className="text-sm text-gray-500 mt-1">Purchase credits to activate subscriptions</p>
                </Link>
                <Link href="/reseller/reports" className="group p-6 bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                        <span className="material-symbols-outlined text-purple-600 text-2xl">assessment</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">View Reports</h3>
                    <p className="text-sm text-gray-500 mt-1">Track earnings and client analytics</p>
                </Link>
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Clients */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Recent Clients</h2>
                            <p className="text-sm text-gray-500">Your latest client activations</p>
                        </div>
                        <Link href="/reseller/clients" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                            View All
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                    <div className="p-6">
                        {clients.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-gray-400 text-3xl">people</span>
                                </div>
                                <p className="text-gray-500">No clients yet</p>
                                <Link href="/reseller/clients?action=add" className="text-blue-600 font-medium hover:underline">Add your first client</Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {clients.slice(0, 4).map((client) => (
                                    <Link key={client.id} href={`/reseller/clients/${client.id}`} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                                                {client.client_name[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{client.client_name}</div>
                                                <div className="text-sm text-gray-500">{client.client_email}</div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${client.status === "active" ? "bg-green-100 text-green-700" :
                                            client.status === "expired" ? "bg-red-100 text-red-700" :
                                                "bg-gray-100 text-gray-700"
                                            }`}>
                                            {client.status}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                            <p className="text-sm text-gray-500">Your transaction history</p>
                        </div>
                        <Link href="/reseller/billing" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                            View All
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                    <div className="p-6">
                        {transactions.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-gray-400 text-3xl">receipt_long</span>
                                </div>
                                <p className="text-gray-500">No transactions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.amount > 0 ? "bg-green-100" : "bg-red-100"}`}>
                                                <span className={`material-symbols-outlined ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                                    {tx.amount > 0 ? "add" : "remove"}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 capitalize">{tx.type.replace(/_/g, " ")}</div>
                                                <div className="text-sm text-gray-500">{tx.description}</div>
                                            </div>
                                        </div>
                                        <div className={`font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                            {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
