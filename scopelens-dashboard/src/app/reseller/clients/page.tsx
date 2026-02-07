"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
}

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
}

type FilterType = "all" | "active" | "expired" | "expiring";

export default function ResellerClientsPage() {
    const searchParams = useSearchParams();
    const [clients, setClients] = useState<Client[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>((searchParams.get("filter") as FilterType) || "all");
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(searchParams.get("action") === "add");

    // Add client form state
    const [newClient, setNewClient] = useState({
        client_name: "",
        client_email: "",
        plan_id: "",
        billing_cycle: "monthly" as "monthly" | "yearly",
    });
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [clientsRes, plansRes] = await Promise.all([
                fetch("/api/reseller/clients"),
                fetch("/api/reseller/plans"),
            ]);

            if (clientsRes.ok) {
                const data = await clientsRes.json();
                setClients(data.clients || []);
            }
            if (plansRes.ok) {
                const data = await plansRes.json();
                setPlans(data.plans || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        setError("");

        try {
            const res = await fetch("/api/reseller/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newClient),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add client");
            }

            // Refresh clients list
            await fetchData();
            setShowAddModal(false);
            setNewClient({ client_name: "", client_email: "", plan_id: "", billing_cycle: "monthly" });
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setAdding(false);
        }
    };

    // Filter clients
    const filteredClients = clients.filter((client) => {
        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            if (!client.client_name.toLowerCase().includes(searchLower) &&
                !client.client_email.toLowerCase().includes(searchLower)) {
                return false;
            }
        }

        // Status filter
        if (filter === "active") return client.status === "active";
        if (filter === "expired") return client.status === "expired";
        if (filter === "expiring") {
            const expires = new Date(client.expires_at);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return client.status === "active" && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
        }
        return true;
    });

    const selectedPlan = plans.find((p) => p.id === newClient.plan_id);
    const price = selectedPlan
        ? newClient.billing_cycle === "monthly"
            ? selectedPlan.price_monthly
            : selectedPlan.price_yearly
        : 0;
    const resellerCost = price * 0.8; // 20% discount
    const profit = price - resellerCost;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading clients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
                    <p className="text-gray-500 mt-1">Manage your client subscriptions</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
                >
                    <span className="material-symbols-outlined">person_add</span>
                    Add Client
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search clients..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                    {(["all", "active", "expired", "expiring"] as FilterType[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === f
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {f === "all" ? "All" : f === "active" ? "Active" : f === "expired" ? "Expired" : "Expiring Soon"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{clients.filter((c) => c.status === "active").length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Expired</p>
                    <p className="text-2xl font-bold text-red-600">{clients.filter((c) => c.status === "expired").length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Total Profit</p>
                    <p className="text-2xl font-bold text-blue-600">${clients.reduce((sum, c) => sum + c.profit, 0).toLocaleString()}</p>
                </div>
            </div>

            {/* Clients Table */}
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
                {filteredClients.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-gray-400 text-4xl">people</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {clients.length === 0 ? "No clients yet" : "No clients match your filters"}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {clients.length === 0
                                ? "Add your first client to get started"
                                : "Try adjusting your search or filter criteria"}
                        </p>
                        {clients.length === 0 && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
                            >
                                Add First Client
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Client</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Plan</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Expires</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Profit</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client, index) => (
                                <tr key={client.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                                                {client.client_name[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{client.client_name}</div>
                                                <div className="text-sm text-gray-500">{client.client_email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{client.plans?.name || "Unknown"}</div>
                                        <div className="text-sm text-gray-500">${client.retail_price}/{client.billing_cycle === "monthly" ? "mo" : "yr"}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${client.status === "active" ? "bg-green-100 text-green-700" :
                                            client.status === "expired" ? "bg-red-100 text-red-700" :
                                                client.status === "cancelled" ? "bg-gray-100 text-gray-700" :
                                                    "bg-amber-100 text-amber-700"
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${client.status === "active" ? "bg-green-500" :
                                                client.status === "expired" ? "bg-red-500" :
                                                    client.status === "cancelled" ? "bg-gray-500" :
                                                        "bg-amber-500"
                                                }`}></span>
                                            {client.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {new Date(client.expires_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-green-600">+${client.profit}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/reseller/clients/${client.id}`}
                                            className="inline-flex items-center gap-1 px-4 py-2 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                                        >
                                            View
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Client Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Add New Client</h2>
                                <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleAddClient} className="p-6 space-y-5">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newClient.client_name}
                                    onChange={(e) => setNewClient({ ...newClient, client_name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Client Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newClient.client_email}
                                    onChange={(e) => setNewClient({ ...newClient, client_email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                                <select
                                    required
                                    value={newClient.plan_id}
                                    onChange={(e) => setNewClient({ ...newClient, plan_id: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select a plan</option>
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - ${plan.price_monthly}/mo
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Billing Cycle</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewClient({ ...newClient, billing_cycle: "monthly" })}
                                        className={`p-4 rounded-xl border-2 transition-all ${newClient.billing_cycle === "monthly"
                                            ? "border-blue-600 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <div className="font-semibold text-gray-900">Monthly</div>
                                        <div className="text-sm text-gray-500">Billed every month</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewClient({ ...newClient, billing_cycle: "yearly" })}
                                        className={`p-4 rounded-xl border-2 transition-all ${newClient.billing_cycle === "yearly"
                                            ? "border-blue-600 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <div className="font-semibold text-gray-900">Yearly</div>
                                        <div className="text-sm text-gray-500">Save 2 months</div>
                                    </button>
                                </div>
                            </div>

                            {selectedPlan && (
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Retail Price</span>
                                        <span className="font-medium">${price}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Your Cost (20% off)</span>
                                        <span className="font-medium text-blue-600">-${resellerCost.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-2 mt-2">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-gray-900">Your Profit</span>
                                            <span className="font-bold text-green-600">+${profit.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={adding || !newClient.plan_id}
                                className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {adding ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Adding Client...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">person_add</span>
                                        Add Client (Deduct ${resellerCost.toFixed(2)})
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
