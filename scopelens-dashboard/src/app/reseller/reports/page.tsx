"use client";

import { useState, useEffect } from "react";

interface Client {
    id: string;
    client_name: string;
    status: string;
    profit: number;
    retail_price: number;
    created_at: string;
    plans?: { name: string };
}

interface MonthlyData {
    month: string;
    clients: number;
    revenue: number;
    profit: number;
}

export default function ResellerReportsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/reseller/clients");
            if (res.ok) {
                const data = await res.json();
                setClients(data.clients || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats
    const totalRevenue = clients.reduce((sum, c) => sum + c.retail_price, 0);
    const totalProfit = clients.reduce((sum, c) => sum + c.profit, 0);
    const activeClients = clients.filter((c) => c.status === "active").length;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

    // Group clients by plan
    const planBreakdown = clients.reduce((acc, client) => {
        const planName = client.plans?.name || "Unknown";
        if (!acc[planName]) {
            acc[planName] = { count: 0, revenue: 0, profit: 0 };
        }
        acc[planName].count++;
        acc[planName].revenue += client.retail_price;
        acc[planName].profit += client.profit;
        return acc;
    }, {} as Record<string, { count: number; revenue: number; profit: number }>);

    // Monthly data (last 6 months)
    const monthlyData: MonthlyData[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = month.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        const monthClients = clients.filter((c) => {
            const created = new Date(c.created_at);
            return created.getMonth() === month.getMonth() && created.getFullYear() === month.getFullYear();
        });
        monthlyData.push({
            month: monthStr,
            clients: monthClients.length,
            revenue: monthClients.reduce((sum, c) => sum + c.retail_price, 0),
            profit: monthClients.reduce((sum, c) => sum + c.profit, 0),
        });
    }

    // Find max for chart scaling
    const maxProfit = Math.max(...monthlyData.map((d) => d.profit), 1);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                    <p className="text-gray-500 mt-1">Track your earnings and client analytics</p>
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1">
                    {(["7d", "30d", "90d", "all"] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${timeRange === range
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "All Time"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 font-medium">Total Profit</span>
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-600">trending_up</span>
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-green-600 mb-1">${totalProfit.toLocaleString()}</div>
                    <p className="text-gray-400 text-sm">All-time earnings</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 font-medium">Total Revenue</span>
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600">payments</span>
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">${totalRevenue.toLocaleString()}</div>
                    <p className="text-gray-400 text-sm">Client subscriptions</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 font-medium">Profit Margin</span>
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-600">percent</span>
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-green-600 mb-1">{profitMargin}%</div>
                    <p className="text-gray-400 text-sm">Per client average</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 font-medium">Active Clients</span>
                        <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-purple-600">people</span>
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">{activeClients}</div>
                    <p className="text-gray-400 text-sm">{clients.length} total clients</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Monthly Profit Chart */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Monthly Profit</h2>
                    <div className="h-64 flex items-end gap-3">
                        {monthlyData.map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">${data.profit}</span>
                                <div
                                    className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                                    style={{ height: `${Math.max((data.profit / maxProfit) * 100, 5)}%` }}
                                ></div>
                                <span className="text-xs text-gray-500">{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Client Growth */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">New Clients per Month</h2>
                    <div className="h-64 flex items-end gap-3">
                        {monthlyData.map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{data.clients}</span>
                                <div
                                    className="w-full bg-green-500 rounded-t-lg transition-all hover:bg-green-600"
                                    style={{ height: `${Math.max((data.clients / Math.max(...monthlyData.map(d => d.clients), 1)) * 100, 5)}%` }}
                                ></div>
                                <span className="text-xs text-gray-500">{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Plan Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Profit by Plan</h2>
                        <p className="text-sm text-gray-500">Breakdown of earnings per subscription plan</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors">
                        <span className="material-symbols-outlined">download</span>
                        Export CSV
                    </button>
                </div>

                {Object.keys(planBreakdown).length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-gray-400 text-3xl">bar_chart</span>
                        </div>
                        <p className="text-gray-500">No data available yet</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 rounded-xl">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 rounded-l-xl">Plan</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Clients</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Revenue</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 rounded-r-xl">Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(planBreakdown).map(([plan, data], index) => (
                                <tr key={plan} className={`border-b border-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                            <span className="font-medium text-gray-900">{plan}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{data.count}</td>
                                    <td className="px-6 py-4 text-gray-600">${data.revenue.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-green-600">${data.profit.toLocaleString()}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
