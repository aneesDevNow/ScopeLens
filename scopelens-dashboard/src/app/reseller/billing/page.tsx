"use client";

import { useState, useEffect } from "react";

interface ResellerProfile {
    id: string;
    credit_balance: number;
    total_spent: number;
    total_purchased: number;
}

interface Transaction {
    id: string;
    type: string;
    amount: number;
    description: string;
    created_at: string;
}

const CREDIT_PACKAGES = [
    { amount: 50, bonus: 0, popular: false },
    { amount: 100, bonus: 5, popular: false },
    { amount: 250, bonus: 20, popular: true },
    { amount: 500, bonus: 50, popular: false },
    { amount: 1000, bonus: 150, popular: false },
];

export default function ResellerBillingPage() {
    const [profile, setProfile] = useState<ResellerProfile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState("");
    const [filter, setFilter] = useState<"all" | "credit" | "spend">("all");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, transactionsRes] = await Promise.all([
                fetch("/api/reseller/profile"),
                fetch("/api/reseller/transactions"),
            ]);

            if (profileRes.ok) {
                const data = await profileRes.json();
                setProfile(data.profile);
            }
            if (transactionsRes.ok) {
                const data = await transactionsRes.json();
                setTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (amount: number) => {
        setPurchasing(true);
        try {
            const res = await fetch("/api/reseller/credits/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });

            if (res.ok) {
                await fetchData();
                setSelectedPackage(null);
                setCustomAmount("");
                // Update sidebar credit balance
                const el = document.getElementById("sidebar-credit-balance");
                const newBalance = (profile?.credit_balance || 0) + amount;
                if (el) el.textContent = `$${newBalance.toLocaleString()}`;
            }
        } catch (error) {
            console.error("Error purchasing credits:", error);
        } finally {
            setPurchasing(false);
        }
    };

    const filteredTransactions = transactions.filter((tx) => {
        if (filter === "credit") return tx.amount > 0;
        if (filter === "spend") return tx.amount < 0;
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading billing...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Billing & Credits</h1>
                <p className="text-gray-500 mt-1">Manage your credit balance and view transaction history</p>
            </div>

            {/* Balance Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Current Balance */}
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 font-medium">Current Balance</span>
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600">account_balance_wallet</span>
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">${profile?.credit_balance?.toLocaleString() || "0"}</div>
                    <p className="text-gray-400 text-sm">Available for client activations</p>
                </div>

                {/* Total Purchased */}
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 font-medium">Total Purchased</span>
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-600">add_card</span>
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">${profile?.total_purchased?.toLocaleString() || "0"}</div>
                    <p className="text-gray-400 text-sm">All-time credit purchases</p>
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
            </div>

            {/* Buy Credits Section */}
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Buy Credits</h2>
                        <p className="text-gray-500 text-sm">Purchase credits to activate client subscriptions</p>
                    </div>
                </div>

                {/* Credit Packages */}
                <div className="grid md:grid-cols-5 gap-4 mb-6">
                    {CREDIT_PACKAGES.map((pkg) => (
                        <button
                            key={pkg.amount}
                            onClick={() => setSelectedPackage(pkg.amount)}
                            className={`relative p-5 rounded-2xl border-2 transition-all ${selectedPackage === pkg.amount
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                                    Most Popular
                                </div>
                            )}
                            <div className="text-2xl font-bold text-gray-900">${pkg.amount}</div>
                            {pkg.bonus > 0 && (
                                <div className="text-sm text-green-600 font-medium mt-1">+${pkg.bonus} bonus</div>
                            )}
                            <div className="text-sm text-gray-500 mt-2">
                                {pkg.bonus > 0 ? `Get $${pkg.amount + pkg.bonus}` : `Get $${pkg.amount}`}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Custom Amount */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-xs">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                        <input
                            type="number"
                            value={customAmount}
                            onChange={(e) => {
                                setCustomAmount(e.target.value);
                                setSelectedPackage(null);
                            }}
                            placeholder="Custom amount"
                            min="10"
                            className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <span className="text-gray-500">Minimum $10</span>
                </div>

                {/* Purchase Button */}
                <button
                    onClick={() => {
                        const amount = selectedPackage || (customAmount ? parseInt(customAmount) : 0);
                        if (amount >= 10) handlePurchase(amount);
                    }}
                    disabled={purchasing || (!selectedPackage && (!customAmount || parseInt(customAmount) < 10))}
                    className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {purchasing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">shopping_cart</span>
                            Purchase Credits
                        </>
                    )}
                </button>

                <p className="text-sm text-gray-500 mt-4">
                    Note: This is a demo. In production, this would integrate with Stripe or another payment provider.
                </p>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
                        <p className="text-sm text-gray-500">{transactions.length} total transactions</p>
                    </div>
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        {(["all", "credit", "spend"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === f
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {f === "all" ? "All" : f === "credit" ? "Credits Added" : "Spending"}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-gray-400 text-4xl">receipt_long</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
                        <p className="text-gray-500">Purchase credits to see your transaction history</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Transaction</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Description</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map((tx, index) => (
                                <tr key={tx.id} className={`border-b border-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount > 0 ? "bg-green-100" : "bg-red-100"}`}>
                                                <span className={`material-symbols-outlined ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                                    {tx.amount > 0 ? "add" : "remove"}
                                                </span>
                                            </div>
                                            <span className="font-medium text-gray-900 capitalize">{tx.type.replace(/_/g, " ")}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{tx.description}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                            {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </span>
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
