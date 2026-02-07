"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ResellerProfile {
    id: string;
    credit_balance: number;
    total_spent: number;
    commission_earned: number;
    is_active: boolean;
}

interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
    reseller_price_monthly: number;
    reseller_price_yearly: number;
    reseller_discount_percent: number;
}

interface Client {
    id: string;
    client_name: string;
    client_email: string;
    plan_id: string;
    status: "active" | "expired" | "cancelled" | "pending";
    retail_price: number;
    reseller_cost: number;
    profit: number;
    billing_cycle: string;
    expires_at: string;
    created_at: string;
    plans?: {
        name: string;
    };
}

interface Transaction {
    id: string;
    type: string;
    amount: number;
    balance_after: number;
    description: string;
    created_at: string;
}

export default function ResellerDashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<ResellerProfile | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isReseller, setIsReseller] = useState(true);

    // UI State
    const [showAddClient, setShowAddClient] = useState(false);
    const [showAllClients, setShowAllClients] = useState(false);
    const [showTransactions, setShowTransactions] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Form State
    const [newClientName, setNewClientName] = useState("");
    const [newClientEmail, setNewClientEmail] = useState("");
    const [selectedPlan, setSelectedPlan] = useState("");
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [submitting, setSubmitting] = useState(false);

    // Redirect to dashboard if user is a reseller
    useEffect(() => {
        if (!loading && isReseller && profile) {
            router.replace("/reseller/dashboard");
        }
    }, [loading, isReseller, profile, router]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const profileRes = await fetch("/api/reseller/profile");
            if (profileRes.status === 404) {
                setIsReseller(false);
                setLoading(false);
                return;
            }
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setProfile(profileData.profile);
            }

            const clientsRes = await fetch("/api/reseller/clients");
            if (clientsRes.ok) {
                const clientsData = await clientsRes.json();
                setClients(clientsData.clients || []);
            }

            const plansRes = await fetch("/api/reseller/plans");
            if (plansRes.ok) {
                const plansData = await plansRes.json();
                setPlans(plansData.plans || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await fetch("/api/reseller/transactions");
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    };

    const handleAddClient = async () => {
        if (!newClientName || !newClientEmail || !selectedPlan) return;
        setSubmitting(true);

        try {
            const res = await fetch("/api/reseller/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_name: newClientName,
                    client_email: newClientEmail,
                    plan_id: selectedPlan,
                    billing_cycle: billingCycle,
                }),
            });

            if (res.ok) {
                await fetchData();
                setShowAddClient(false);
                setNewClientName("");
                setNewClientEmail("");
                setSelectedPlan("");
            } else {
                const error = await res.json();
                alert(error.error || "Failed to add client");
            }
        } catch (error) {
            console.error("Error adding client:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    const estimatedCost = selectedPlanData
        ? (billingCycle === "monthly" ? selectedPlanData.reseller_price_monthly : selectedPlanData.reseller_price_yearly)
        : 0;
    const estimatedProfit = selectedPlanData
        ? ((billingCycle === "monthly" ? selectedPlanData.price_monthly : selectedPlanData.price_yearly) - estimatedCost)
        : 0;

    const filteredClients = clients.filter(c =>
        c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.client_email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeClients = clients.filter(c => c.status === "active");
    const totalProfit = clients.reduce((sum, c) => sum + c.profit, 0);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading reseller dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isReseller) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50">
                <div className="max-w-lg w-full">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-blue-500/10 border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-blue-700 p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                            <div className="relative">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold">Become a Reseller</h2>
                                <p className="opacity-90 mt-3 text-lg">Join our reseller program to earn commissions by selling ScopeLens to your clients.</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <ul className="space-y-5">
                                <li className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-900">10-20% profit margins</span>
                                        <p className="text-sm text-gray-500">On every sale you make</p>
                                    </div>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-900">Client portfolio dashboard</span>
                                        <p className="text-sm text-gray-500">Manage all your clients in one place</p>
                                    </div>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-900">Flexible credit billing</span>
                                        <p className="text-sm text-gray-500">Pay only for what you use</p>
                                    </div>
                                </li>
                            </ul>
                            <button className="w-full mt-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-xl shadow-purple-500/25 text-lg">
                                Apply to Become a Reseller
                            </button>
                            <p className="text-center text-sm text-gray-400 mt-4">Free to join • No hidden fees</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-purple-50/30 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full mb-3">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Verified Reseller
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Reseller Dashboard</h1>
                    <p className="text-gray-500 mt-1">Manage your clients, credits, and earnings</p>
                </div>
                <button
                    onClick={() => setShowAddClient(true)}
                    className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-xl shadow-purple-500/25"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add Client
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                {/* Credit Balance */}
                <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-purple-500/25 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <span className="text-sm opacity-80">Credit Balance</span>
                        </div>
                        <div className="text-4xl font-bold">${profile?.credit_balance?.toLocaleString() || "0"}</div>
                        <button
                            onClick={() => { fetchTransactions(); setShowTransactions(true); }}
                            className="mt-4 text-sm text-white/80 hover:text-white transition-colors flex items-center gap-1"
                        >
                            View transactions
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Active Clients */}
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-500">Active Clients</span>
                    </div>
                    <div className="text-4xl font-bold text-gray-900">{activeClients.length}</div>
                    <p className="mt-2 text-sm text-gray-400">{clients.length} total clients</p>
                </div>

                {/* Total Spent */}
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-500">Total Spent</span>
                    </div>
                    <div className="text-4xl font-bold text-gray-900">${profile?.total_spent?.toLocaleString() || "0"}</div>
                    <p className="mt-2 text-sm text-gray-400">On client activations</p>
                </div>

                {/* Total Profit */}
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-500">Total Profit</span>
                    </div>
                    <div className="text-4xl font-bold text-green-600">${totalProfit.toLocaleString()}</div>
                    <p className="mt-2 text-sm text-gray-400">Commission earned</p>
                </div>
            </div>

            {/* Recent Clients */}
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Recent Clients</h2>
                        <p className="text-sm text-gray-500">Your latest client activations</p>
                    </div>
                    <button
                        onClick={() => setShowAllClients(true)}
                        className="px-4 py-2 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        View All Clients
                    </button>
                </div>
                <div className="p-6">
                    {clients.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-500">No clients yet. Add your first client to get started!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {clients.slice(0, 5).map((client) => (
                                <div
                                    key={client.id}
                                    onClick={() => setSelectedClient(client)}
                                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                                            {client.client_name[0]}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">{client.client_name}</div>
                                            <div className="text-sm text-gray-500">{client.client_email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${client.status === "active" ? "bg-green-100 text-green-700" :
                                            client.status === "expired" ? "bg-red-100 text-red-700" :
                                                "bg-gray-100 text-gray-700"
                                            }`}>
                                            {client.status}
                                        </span>
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-900">${client.retail_price}/{client.billing_cycle === "monthly" ? "mo" : "yr"}</div>
                                            <div className="text-sm text-green-600 font-medium">+${client.profit} profit</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Client Modal */}
            {showAddClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Add New Client</h3>
                            <p className="text-sm text-gray-500 mt-1">Create a subscription for a new client</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Client Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter client name"
                                    value={newClientName}
                                    onChange={(e) => setNewClientName(e.target.value)}
                                    className="rounded-xl border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Client Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="client@example.com"
                                    value={newClientEmail}
                                    onChange={(e) => setNewClientEmail(e.target.value)}
                                    className="rounded-xl border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Plan</Label>
                                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                    <SelectTrigger className="rounded-xl border-gray-200">
                                        <SelectValue placeholder="Select a plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans.filter(p => p.price_monthly > 0).map((plan) => (
                                            <SelectItem key={plan.id} value={plan.id}>
                                                {plan.name} - ${plan.price_monthly}/mo (You pay: ${plan.reseller_price_monthly})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Billing Cycle</Label>
                                <Select value={billingCycle} onValueChange={setBillingCycle}>
                                    <SelectTrigger className="rounded-xl border-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedPlanData && (
                                <div className="p-4 rounded-xl bg-gray-50 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Your Cost:</span>
                                        <span className="font-semibold">${estimatedCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Client Pays:</span>
                                        <span className="font-semibold">
                                            ${billingCycle === "monthly" ? selectedPlanData.price_monthly : selectedPlanData.price_yearly}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-200 pt-2">
                                        <span className="text-green-600 font-medium">Your Profit:</span>
                                        <span className="text-green-600 font-bold">${estimatedProfit.toLocaleString()}</span>
                                    </div>
                                    {profile && estimatedCost > profile.credit_balance && (
                                        <div className="flex items-center gap-2 text-red-600 text-sm mt-2 p-3 bg-red-50 rounded-lg">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Insufficient credits. You need ${estimatedCost - profile.credit_balance} more.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl"
                                onClick={() => {
                                    setShowAddClient(false);
                                    setNewClientName("");
                                    setNewClientEmail("");
                                    setSelectedPlan("");
                                }}
                            >
                                Cancel
                            </Button>
                            <button
                                onClick={handleAddClient}
                                disabled={!newClientName || !newClientEmail || !selectedPlan || submitting || !!(profile && estimatedCost > profile.credit_balance)}
                                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Adding..." : "Add Client"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* All Clients Modal */}
            {showAllClients && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">All Clients ({clients.length})</h3>
                            <p className="text-sm text-gray-500 mt-1">View and manage your client portfolio</p>
                            <div className="relative mt-4">
                                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <Input
                                    placeholder="Search clients..."
                                    className="pl-10 rounded-xl border-gray-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {filteredClients.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No clients found</p>
                            ) : (
                                <div className="space-y-3">
                                    {filteredClients.map((client) => (
                                        <div
                                            key={client.id}
                                            onClick={() => setSelectedClient(client)}
                                            className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                                                    {client.client_name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{client.client_name}</div>
                                                    <div className="text-sm text-gray-500">{client.client_email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${client.status === "active" ? "bg-green-100 text-green-700" :
                                                    client.status === "expired" ? "bg-red-100 text-red-700" :
                                                        "bg-gray-100 text-gray-700"
                                                    }`}>
                                                    {client.status}
                                                </span>
                                                <div className="text-right">
                                                    <div className="font-semibold text-gray-900">{client.plans?.name || "—"}</div>
                                                    <div className="text-sm text-green-600 font-medium">+${client.profit} profit</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <Button
                                variant="outline"
                                className="w-full rounded-xl"
                                onClick={() => { setShowAllClients(false); setSearchQuery(""); }}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Client Detail Modal */}
            {selectedClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                    {selectedClient.client_name[0]}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedClient.client_name}</h3>
                                    <p className="text-sm text-gray-500">{selectedClient.client_email}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-500 mb-1">Plan</div>
                                    <div className="font-semibold text-gray-900">{selectedClient.plans?.name || "—"}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-500 mb-1">Billing</div>
                                    <div className="font-semibold text-gray-900 capitalize">{selectedClient.billing_cycle}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-500 mb-1">Status</div>
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${selectedClient.status === "active" ? "bg-green-100 text-green-700" :
                                        selectedClient.status === "expired" ? "bg-red-100 text-red-700" :
                                            "bg-gray-100 text-gray-700"
                                        }`}>
                                        {selectedClient.status}
                                    </span>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-500 mb-1">Expires</div>
                                    <div className="font-semibold text-gray-900">{new Date(selectedClient.expires_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Client Price:</span>
                                    <span className="font-semibold">${selectedClient.retail_price}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Your Cost:</span>
                                    <span className="font-semibold">${selectedClient.reseller_cost}</span>
                                </div>
                                <div className="flex justify-between border-t border-green-200 pt-3">
                                    <span className="text-green-700 font-semibold">Your Profit:</span>
                                    <span className="text-green-700 font-bold text-lg">${selectedClient.profit}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setSelectedClient(null)}>
                                Close
                            </Button>
                            {selectedClient.status === "active" && (
                                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Renew
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Transactions Modal */}
            {showTransactions && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Transaction History</h3>
                            <p className="text-sm text-gray-500 mt-1">Your credit transaction log</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {transactions.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No transactions yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount > 0 ? "bg-green-100" : "bg-red-100"}`}>
                                                    <svg className={`w-5 h-5 ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tx.amount > 0 ? "M12 6v12m6-6H6" : "M18 12H6"} />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 capitalize">{tx.type.replace(/_/g, " ")}</div>
                                                    <div className="text-sm text-gray-500">{tx.description}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                                                </div>
                                                <div className="text-sm text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowTransactions(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
