"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Plan {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    price_yearly: number;
    scans_per_day: number;
    features: string[];
    is_popular?: boolean;
}

function ScopeLensLogo() {
    return (
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-5 h-5">
                <circle cx="100" cy="88" r="45" fill="none" stroke="white" strokeWidth="8" opacity="0.95" />
                <circle cx="100" cy="88" r="32" fill="none" stroke="white" strokeWidth="4" opacity="0.7" />
                <circle cx="92" cy="80" r="8" fill="white" opacity="0.4" />
                <line x1="70" y1="78" x2="130" y2="78" stroke="white" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
                <line x1="75" y1="88" x2="125" y2="88" stroke="white" strokeWidth="3" opacity="0.8" strokeLinecap="round" />
                <line x1="70" y1="98" x2="130" y2="98" stroke="white" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
                <rect x="132" y="118" width="14" height="45" rx="7" fill="white" opacity="0.95" transform="rotate(45, 139, 140)" />
            </svg>
        </div>
    );
}

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const planSlug = searchParams.get("plan");
    const { formatPrice, currency } = useCurrency();

    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "bank_transfer">("card");
    const [screenshot, setScreenshot] = useState<File | null>(null);

    // Form state
    const [cardName, setCardName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");


    useEffect(() => {
        if (currency === "PKR") {
            setPaymentMethod("bank_transfer");
        } else {
            setPaymentMethod("card");
        }
    }, [currency]);

    useEffect(() => {
        if (!planSlug) {
            setLoading(false);
            return;
        }

        async function fetchPlan() {
            try {
                const res = await fetch("/api/plans");
                if (res.ok) {
                    const data = await res.json();
                    const found = data.plans.find((p: Plan) => p.slug === planSlug);
                    setPlan(found || null);
                }
            } catch (err) {
                console.error("Failed to fetch plan:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchPlan();
    }, [planSlug]);

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
            return v.substring(0, 2) + " / " + v.substring(2, 4);
        }
        return v;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setScreenshot(e.target.files[0]);
        }
    };

    async function handlePurchase(e: React.FormEvent) {
        e.preventDefault();
        if (!plan || processing) return;

        setProcessing(true);
        setError(null);

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            // Redirect to thank you page
            router.push(`/checkout/thank-you?plan=${planSlug}`);
        } catch (err) {
            console.error("Purchase error:", err);
            setError("Network error. Please try again.");
            setProcessing(false);
        }
    }

    const tax = plan ? plan.price_monthly * 0.02 : 0;
    const total = plan ? plan.price_monthly + tax : 0;

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-500">Loading checkout...</p>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-slate-700 mb-1">No Plan Selected</h1>
                    <p className="text-sm text-slate-500 mb-4">Please select a plan to proceed with checkout.</p>
                    <Link
                        href="/plans"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                    >
                        View Plans
                    </Link>
                </div>
            </div>
        );
    }

    const directPaymentEnabled = process.env.NEXT_PUBLIC_DIRECT_PAYMENT === "true";

    if (!directPaymentEnabled) {
        return (
            <div className="h-screen flex flex-col">
                <nav className="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <Link href="/plans" className="flex items-center gap-2.5">
                            <ScopeLensLogo />
                            <span className="text-lg font-bold text-slate-700">Scope Lens</span>
                        </Link>
                    </div>
                </nav>
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-700 mb-3">Direct Payment Unavailable</h1>
                        <p className="text-slate-500 leading-relaxed mb-6">
                            Direct payment is currently unavailable. Please contact your reseller to purchase a work purchase key,
                            or use a work purchase key if you already have one.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a
                                href={`${process.env.NEXT_PUBLIC_RESELLER_URL || 'http://localhost:3003'}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Find a Reseller
                            </a>
                            <Link
                                href="/plans"
                                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-600 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                Use Work Purchase Key
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Top Navbar */}
            <nav className="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link href="/plans" className="flex items-center gap-2.5">
                        <ScopeLensLogo />
                        <span className="text-lg font-bold text-slate-700">Scope Lens</span>
                    </Link>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="font-medium">Secure Checkout</span>
                    </div>
                </div>
            </nav>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    {/* Page Header */}
                    <div className="mb-5">
                        <h1 className="text-2xl font-bold text-slate-700 mb-1">Secure Checkout</h1>
                        <p className="text-sm text-slate-500">Complete your purchase to activate your subscription.</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-700">Payment Details</span>
                            <span className="text-xs text-slate-500">Step 2 of 3</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" style={{ width: "66%" }}></div>
                        </div>
                    </div>

                    <form onSubmit={handlePurchase}>
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Left Column: Payment Form */}
                            <div className="lg:col-span-2 space-y-5">
                                {/* Payment Method Card */}
                                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                    <h2 className="text-base font-bold text-slate-700 mb-4">Payment Method</h2>

                                    {/* Method Selector */}
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        {currency === "PKR" ? (
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod("bank_transfer")}
                                                className={`col-span-2 flex items-center justify-center gap-2.5 p-3 rounded-lg border-2 transition-all text-sm border-blue-600 bg-blue-50/50`}
                                            >
                                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                                </svg>
                                                <span className="font-semibold text-slate-700">Bank Transfer (PK Only)</span>
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMethod("card")}
                                                    className={`flex items-center gap-2.5 p-3 rounded-lg border-2 transition-all text-sm ${paymentMethod === "card"
                                                        ? "border-blue-600 bg-blue-50/50"
                                                        : "border-slate-200 hover:border-slate-300"
                                                        }`}
                                                >
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                    </svg>
                                                    <span className="font-semibold text-slate-700">Credit Card</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMethod("paypal")}
                                                    className={`flex items-center gap-2.5 p-3 rounded-lg border-2 transition-all text-sm ${paymentMethod === "paypal"
                                                        ? "border-blue-600 bg-blue-50/50"
                                                        : "border-slate-200 hover:border-slate-300"
                                                        }`}
                                                >
                                                    <svg className="w-5 h-5 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 2.818A.764.764 0 015.7 2.16h6.152c2.07 0 3.58.465 4.454 1.393.847.908 1.108 2.21.773 3.863-.018.087-.04.181-.06.27-.022.089-.048.185-.078.288l-.012.048v.209l.146.084c.61.353 1.093.83 1.426 1.424a4.49 4.49 0 01.52 2.476c-.064.625-.222 1.244-.47 1.827a4.91 4.91 0 01-1.062 1.49 4.26 4.26 0 01-1.527.929c-.592.224-1.262.338-1.985.338h-.473a1.163 1.163 0 00-1.149.98l-.036.193-.61 3.874-.028.14a.096.096 0 01-.024.063.092.092 0 01-.058.024H7.076z" />
                                                    </svg>
                                                    <span className="font-semibold text-slate-700">PayPal</span>
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="mb-4 p-3 text-xs text-red-700 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {error}
                                        </div>
                                    )}

                                    {paymentMethod === "bank_transfer" && (
                                        <div className="space-y-6">
                                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Bank Details
                                                </h3>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-0.5">Bank Name</p>
                                                        <p className="font-medium text-slate-700">Meezan Bank</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-0.5">Account Title</p>
                                                        <p className="font-medium text-slate-700">ScopeLens LLC</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-xs text-slate-500 mb-0.5">Account Number / IBAN</p>
                                                        <p className="font-mono font-medium text-slate-700 tracking-wide">PK00MEZN00000000000000</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-600">Upload Payment Screenshot</label>
                                                <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-blue-500 transition-colors text-center cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        required
                                                    />
                                                    {screenshot ? (
                                                        <div className="flex items-center justify-center gap-2 text-green-600">
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="text-sm font-medium">{screenshot.name}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <svg className="w-8 h-8 text-slate-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                            </svg>
                                                            <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
                                                            <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === "card" && (
                                        <div className="space-y-4">
                                            {/* Card Number */}
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-slate-600">Card Number</label>
                                                <div className="relative">
                                                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                    </svg>
                                                    <input
                                                        type="text"
                                                        placeholder="0000 0000 0000 0000"
                                                        value={cardNumber}
                                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                                        maxLength={19}
                                                        required
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm text-slate-700 placeholder:text-slate-400"
                                                    />
                                                </div>
                                            </div>

                                            {/* Expiry + CVC */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-slate-600">Expiration Date</label>
                                                    <input
                                                        type="text"
                                                        placeholder="MM / YY"
                                                        value={expiry}
                                                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                                        maxLength={7}
                                                        required
                                                        className="w-full px-3 py-2.5 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm text-slate-700 placeholder:text-slate-400"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-slate-600">CVC</label>
                                                    <input
                                                        type="text"
                                                        placeholder="123"
                                                        value={cvc}
                                                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                                        maxLength={4}
                                                        required
                                                        className="w-full px-3 py-2.5 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm text-slate-700 placeholder:text-slate-400"
                                                    />
                                                </div>
                                            </div>

                                            {/* Cardholder Name */}
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-slate-600">Cardholder Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Full Name on Card"
                                                    value={cardName}
                                                    onChange={(e) => setCardName(e.target.value)}
                                                    required
                                                    className="w-full px-3 py-2.5 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-slate-700 placeholder:text-slate-400"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === "paypal" && (
                                        <div className="text-center py-6">
                                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                                                <svg className="w-6 h-6 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 2.818A.764.764 0 015.7 2.16h6.152c2.07 0 3.58.465 4.454 1.393.847.908 1.108 2.21.773 3.863-.018.087-.04.181-.06.27-.022.089-.048.185-.078.288l-.012.048v.209l.146.084c.61.353 1.093.83 1.426 1.424a4.49 4.49 0 01.52 2.476c-.064.625-.222 1.244-.47 1.827a4.91 4.91 0 01-1.062 1.49 4.26 4.26 0 01-1.527.929c-.592.224-1.262.338-1.985.338h-.473a1.163 1.163 0 00-1.149.98l-.036.193-.61 3.874-.028.14a.096.096 0 01-.024.063.092.092 0 01-.058.024H7.076z" />
                                                </svg>
                                            </div>
                                            <p className="text-slate-500 text-xs">You will be redirected to PayPal to complete your purchase.</p>
                                        </div>
                                    )}
                                </div>


                                {/* Security Badges + Button Row */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 text-[10px] text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <span className="font-medium">SSL Encrypted</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            <span className="font-medium">PCI DSS Compliant</span>
                                        </div>
                                    </div>

                                    {/* Complete Purchase Button */}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Processing...
                                            </>
                                        ) : paymentMethod === "bank_transfer" ? (
                                            "Submit Proof"
                                        ) : (
                                            `Pay ${formatPrice(total)}`
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                    <h2 className="text-base font-bold text-slate-700 mb-4">Order Summary</h2>

                                    {/* Plan Info */}
                                    <div className="mb-4">
                                        <div className="flex items-start justify-between mb-1">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">{plan.name}</p>
                                                <p className="text-xs text-blue-600">Monthly Subscription</p>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">{formatPrice(plan.price_monthly)}/mo</p>
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full text-xs text-blue-700 font-medium">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {plan.scans_per_day.toLocaleString()} scans/day
                                            </span>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    {plan.features && plan.features.length > 0 && (
                                        <div className="mb-4 space-y-1.5">
                                            {plan.features.slice(0, 4).map((feature, i) => (
                                                <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Price Breakdown */}
                                    <div className="border-t border-slate-100 pt-3 space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Subtotal</span>
                                            <span className="text-slate-700">{formatPrice(plan.price_monthly)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Tax (2%)</span>
                                            <span className="text-slate-700">{formatPrice(tax)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                            <span className="text-sm font-bold text-slate-700">Total Due</span>
                                            <span className="text-lg font-bold text-blue-600">{formatPrice(total)}</span>
                                        </div>
                                    </div>

                                    {/* Terms */}
                                    <p className="text-[10px] text-slate-400 text-center mt-4 leading-relaxed">
                                        By completing your purchase, you agree to our{" "}
                                        <a href="#" className="text-slate-500 underline hover:text-blue-600 transition-colors">Terms of Service</a>.
                                    </p>
                                </div>

                                {/* Testimonial */}
                                <div className="mt-4 text-center px-2">
                                    <div className="flex justify-center gap-0.5 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 italic leading-relaxed mb-1">
                                        &ldquo;Scope Lens has revolutionized how our department handles grading.&rdquo;
                                    </p>
                                    <p className="text-xs font-semibold text-slate-500">— Dr. Sarah Jenkins, NYU</p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <footer className="text-center text-xs text-slate-400 py-3 border-t border-slate-100">
                    © {new Date().getFullYear()} Scope Lens. All rights reserved.
                </footer>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-500">Loading checkout...</p>
                </div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
