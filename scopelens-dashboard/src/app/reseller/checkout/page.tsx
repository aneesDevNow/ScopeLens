"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrency, CurrencySwitcher } from "@/contexts/CurrencyContext";

interface ResellerProfile {
    id: string;
    credit_balance: number;
    company_name: string | null;
}

const CREDIT_PACKAGES = [
    { amount: 50, bonus: 0, popular: false },
    { amount: 100, bonus: 5, popular: false },
    { amount: 250, bonus: 20, popular: true },
    { amount: 500, bonus: 50, popular: false },
    { amount: 1000, bonus: 150, popular: false },
];

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amountParam = searchParams.get("amount");
    const { formatPrice, currency, symbol } = useCurrency();

    const [profile, setProfile] = useState<ResellerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [selectedAmount, setSelectedAmount] = useState<number>(parseInt(amountParam || "250"));
    const [customAmount, setCustomAmount] = useState("");

    // Form state
    const [cardName, setCardName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/reseller/profile");
            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const amount = customAmount ? parseInt(customAmount) : selectedAmount;

        try {
            // Simulate payment processing
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Add credits
            const res = await fetch("/api/reseller/credits/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });

            if (res.ok) {
                // Get bonus
                const pkg = CREDIT_PACKAGES.find((p) => p.amount === amount);
                const bonus = pkg?.bonus || 0;

                // Redirect to thank you page
                router.push(`/reseller/checkout/thank-you?amount=${amount}&bonus=${bonus}`);
            }
        } catch (error) {
            console.error("Error processing payment:", error);
        } finally {
            setProcessing(false);
        }
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

    const currentAmount = customAmount ? parseInt(customAmount) || 0 : selectedAmount;
    const selectedPackage = CREDIT_PACKAGES.find((p) => p.amount === currentAmount);
    const bonus = selectedPackage?.bonus || 0;
    const totalCredits = currentAmount + bonus;

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

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link href="/reseller/billing" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Billing
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Purchase Credits</h1>
                    <p className="text-gray-500 mt-1">Add credits to your reseller account</p>
                </div>
                <CurrencySwitcher />
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid lg:grid-cols-3 gap-8 max-w-6xl">
                    {/* Credit Selection & Payment Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Credit Packages */}
                        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-green-600">savings</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Select Credit Package</h2>
                                    <p className="text-sm text-gray-500">Choose a package or enter a custom amount</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-5 gap-3 mb-6">
                                {CREDIT_PACKAGES.map((pkg) => (
                                    <button
                                        key={pkg.amount}
                                        type="button"
                                        onClick={() => {
                                            setSelectedAmount(pkg.amount);
                                            setCustomAmount("");
                                        }}
                                        className={`relative p-4 rounded-xl border-2 transition-all ${selectedAmount === pkg.amount && !customAmount
                                            ? "border-blue-600 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        {pkg.popular && (
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
                                                Popular
                                            </div>
                                        )}
                                        <div className="text-xl font-bold text-gray-900">{formatPrice(pkg.amount)}</div>
                                        {pkg.bonus > 0 && (
                                            <div className="text-xs text-green-600 font-medium mt-1">+{formatPrice(pkg.bonus)} bonus</div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="relative flex-1 max-w-xs">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">{symbol}</span>
                                    <input
                                        type="number"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        placeholder="Custom amount"
                                        min="10"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <span className="text-gray-500 text-sm">Minimum {formatPrice(10)}</span>
                            </div>
                        </div>

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
                    </div>

                    {/* Order Summary */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sticky top-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>

                            {/* Current Balance */}
                            <div className="p-4 bg-gray-50 rounded-xl mb-6">
                                <p className="text-sm text-gray-500 mb-1">Current Balance</p>
                                <p className="text-2xl font-bold text-gray-900">{formatPrice(profile?.credit_balance || 0)}</p>
                            </div>

                            {/* Credit Breakdown */}
                            <div className="space-y-3 py-4 border-t border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Credits Purchased</span>
                                    <span className="text-gray-900">{formatPrice(currentAmount)}</span>
                                </div>
                                {bonus > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600">Bonus Credits</span>
                                        <span className="text-green-600 font-medium">+{formatPrice(bonus)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-100">
                                    <span className="text-gray-900">Total Credits</span>
                                    <span className="text-blue-600">{formatPrice(totalCredits)}</span>
                                </div>
                            </div>

                            {/* New Balance Preview */}
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                                <p className="text-sm text-blue-600 mb-1">New Balance After Purchase</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {formatPrice((profile?.credit_balance || 0) + totalCredits)}
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing || currentAmount < 10}
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
                                        Pay {formatPrice(currentAmount)}
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

export default function ResellerCheckoutPage() {
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
