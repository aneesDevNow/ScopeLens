"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCurrency, CurrencySwitcher } from "@/contexts/CurrencyContext";

interface PaymentMethod {
    id: string;
    type: "card";
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
}

interface Invoice {
    id: string;
    date: string;
    amount: number;
    status: "paid" | "pending" | "failed";
    description: string;
}

export default function PaymentPage() {
    const { formatPrice } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [showAddCard, setShowAddCard] = useState(false);
    const [addingCard, setAddingCard] = useState(false);

    // New card form
    const [cardName, setCardName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");

    useEffect(() => {
        fetchPaymentData();
    }, []);

    const fetchPaymentData = async () => {
        // TODO: Fetch real payment methods and invoices from payment API
        await new Promise((resolve) => setTimeout(resolve, 500));

        setPaymentMethods([]);
        setInvoices([]);

        setLoading(false);
    };

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingCard(true);

        // Simulate adding card
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const newCard: PaymentMethod = {
            id: `pm_${Date.now()}`,
            type: "card",
            brand: cardNumber.startsWith("4") ? "Visa" : "Mastercard",
            last4: cardNumber.slice(-4),
            expMonth: parseInt(expiry.split("/")[0]),
            expYear: 2000 + parseInt(expiry.split("/")[1]),
            isDefault: paymentMethods.length === 0,
        };

        setPaymentMethods([...paymentMethods, newCard]);
        setShowAddCard(false);
        setCardName("");
        setCardNumber("");
        setExpiry("");
        setCvc("");
        setAddingCard(false);
    };

    const handleSetDefault = async (id: string) => {
        setPaymentMethods(
            paymentMethods.map((pm) => ({
                ...pm,
                isDefault: pm.id === id,
            }))
        );
    };

    const handleRemoveCard = async (id: string) => {
        setPaymentMethods(paymentMethods.filter((pm) => pm.id !== id));
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || "";
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(" ") : value;
    };

    const formatExpiry = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        if (v.length >= 2) {
            return v.substring(0, 2) + "/" + v.substring(2, 4);
        }
        return v;
    };

    const getCardIcon = (brand: string) => {
        switch (brand.toLowerCase()) {
            case "visa":
                return "💳";
            case "mastercard":
                return "💳";
            case "amex":
                return "💳";
            default:
                return "💳";
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading payment information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
                    <p className="text-gray-500 mt-1">Manage your payment methods and billing history</p>
                </div>
                <CurrencySwitcher />
            </div>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl">
                {/* Payment Methods */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Saved Cards */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-blue-600">credit_card</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
                                    <p className="text-sm text-gray-500">Your saved cards</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddCard(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                Add Card
                            </button>
                        </div>

                        {paymentMethods.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-gray-400 text-3xl">credit_card_off</span>
                                </div>
                                <p className="text-gray-500">No payment methods added yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paymentMethods.map((method) => (
                                    <div
                                        key={method.id}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${method.isDefault ? "border-blue-600 bg-blue-50" : "border-gray-200"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                                {method.brand}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    •••• •••• •••• {method.last4}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Expires {method.expMonth.toString().padStart(2, "0")}/{method.expYear}
                                                </p>
                                            </div>
                                            {method.isDefault && (
                                                <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!method.isDefault && (
                                                <button
                                                    onClick={() => handleSetDefault(method.id)}
                                                    className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    Set Default
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRemoveCard(method.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <span className="material-symbols-outlined text-xl">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Invoice History */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-purple-600">receipt_long</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Invoice History</h2>
                                <p className="text-sm text-gray-500">Your recent transactions</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="py-4 px-4 text-sm text-gray-900">
                                                {new Date(invoice.date).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-900">{invoice.description}</td>
                                            <td className="py-4 px-4 text-sm font-medium text-gray-900">
                                                {formatPrice(invoice.amount)}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${invoice.status === "paid"
                                                        ? "bg-green-100 text-green-700"
                                                        : invoice.status === "pending"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <button className="text-blue-600 hover:underline text-sm">Download</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Billing Summary */}
                <div>
                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sticky top-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Billing Summary</h2>

                        {/* Current Plan */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                            <p className="text-sm text-gray-500 mb-1">Current Plan</p>
                            <p className="text-xl font-bold text-gray-900">No Active Plan</p>
                            <p className="text-sm text-gray-500">Subscribe to get started</p>
                        </div>

                        {/* Next Payment */}
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Next Payment</span>
                                <span className="text-gray-900 font-medium">—</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Amount Due</span>
                                <span className="text-gray-900 font-medium">—</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 space-y-3">
                            <Link
                                href="/plans"
                                className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">swap_horiz</span>
                                Change Plan
                            </Link>
                            <button className="w-full py-3 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-all">
                                Cancel Subscription
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Card Modal */}
            {showAddCard && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Add New Card</h3>
                            <button
                                onClick={() => setShowAddCard(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleAddCard} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                                <input
                                    type="text"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                                <input
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    placeholder="4242 4242 4242 4242"
                                    maxLength={19}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                    <input
                                        type="text"
                                        value={expiry}
                                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                        placeholder="MM/YY"
                                        maxLength={5}
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                                    <input
                                        type="text"
                                        value={cvc}
                                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                        placeholder="123"
                                        maxLength={4}
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddCard(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addingCard}
                                    className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {addingCard ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Adding...
                                        </>
                                    ) : (
                                        "Add Card"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
