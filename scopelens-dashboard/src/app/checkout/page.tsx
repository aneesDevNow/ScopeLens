"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrency, CurrencySwitcher } from "@/contexts/CurrencyContext";

interface Plan {
    id: string;
    name: string;
    price: number;
    scan_limit: number;
    features: string[];
}

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const planId = searchParams.get("plan");
    const { formatPrice, currency } = useCurrency();

    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Form state
    const [cardName, setCardName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [zip, setZip] = useState("");

    useEffect(() => {
        fetchPlan();
    }, [planId]);

    const fetchPlan = async () => {
        if (!planId) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`/api/plans/${planId}`);
            if (res.ok) {
                const data = await res.json();
                setPlan(data.plan);
            }
        } catch (error) {
            console.error("Error fetching plan:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Redirect to thank you page
        router.push(`/checkout/thank-you?plan=${planId}`);
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

    const tax = plan ? plan.price * 0.1 : 0;
    const total = plan ? plan.price + tax : 0;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading checkout...</p>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="p-8">
                <div className="max-w-lg mx-auto text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-red-600 text-4xl">error</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">No Plan Selected</h1>
                    <p className="text-gray-500 mb-8">Please select a plan to proceed with checkout.</p>
                    <Link
                        href="/plans"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        View Plans
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link href="/plans" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Plans
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                    <p className="text-gray-500 mt-1">Complete your subscription purchase</p>
                </div>
                <CurrencySwitcher />
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid lg:grid-cols-3 gap-8 max-w-6xl">
                    {/* Payment Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Details */}
                        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-blue-600">credit_card</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
                                    <p className="text-sm text-gray-500">Enter your card information</p>
                                </div>
                            </div>

                            <div className="space-y-4">
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
                            </div>
                        </div>

                        {/* Billing Address */}
                        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-purple-600">home</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Billing Address</h2>
                                    <p className="text-sm text-gray-500">Where should we send the invoice?</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="123 Main Street"
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            placeholder="San Francisco"
                                            required
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                                        <input
                                            type="text"
                                            value={zip}
                                            onChange={(e) => setZip(e.target.value)}
                                            placeholder="94102"
                                            required
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sticky top-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>

                            {/* Plan Details */}
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-gray-900">{plan.name}</span>
                                    <span className="text-lg font-bold text-blue-600">{formatPrice(plan.price)}/mo</span>
                                </div>
                                <p className="text-sm text-gray-600">{plan.scan_limit.toLocaleString()} scans per month</p>
                            </div>

                            {/* Features */}
                            <div className="mb-6">
                                <p className="text-sm font-medium text-gray-700 mb-3">Included:</p>
                                <ul className="space-y-2">
                                    {plan.features?.slice(0, 4).map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                            <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-3 py-4 border-t border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="text-gray-900">{formatPrice(plan.price)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Tax (10%)</span>
                                    <span className="text-gray-900">{formatPrice(tax)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-100">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-gray-900">{formatPrice(total)}</span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">lock</span>
                                        Pay {formatPrice(total)}
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-center text-gray-400 mt-4">
                                <span className="material-symbols-outlined text-sm align-middle mr-1">verified</span>
                                Secure payment powered by Stripe
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading checkout...</p>
                </div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
