"use client";

import { useState, useEffect, Suspense } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface ResellerData {
    credit_balance: number;
    company_name: string;
}

interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    bonus_credits: number;
    price: number;
    is_popular: boolean;
    sort_order: number;
}

function BillingContent() {
    const { formatPrice } = useCurrency();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [reseller, setReseller] = useState<ResellerData | null>(null);
    const [packages, setPackages] = useState<CreditPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const success = searchParams.get("success");
        if (success === "pending_approval") {
            setSuccessMsg("Payment proof submitted! Your request is under review. Credits will be added once approved.");
            window.history.replaceState(null, "", "/billing");
        } else if (success) {
            setSuccessMsg("Purchase successful! Your credits have been added.");
            window.history.replaceState(null, "", "/billing");
        }
    }, [searchParams]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [profileRes, packagesRes] = await Promise.all([
                    fetch("/api/profile"),
                    fetch("/api/credit-packages")
                ]);

                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setReseller(data.reseller);
                }

                if (packagesRes.ok) {
                    const data = await packagesRes.json();
                    setPackages(data.packages);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setErrorMsg("Failed to load data. Please refresh.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500">Loading billing...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-slate-700 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                    Credit History
                </h1>
                <p className="text-slate-500 text-base font-normal">
                    Purchase credits to generate work purchase keys for your clients
                </p>
            </div>

            {/* Success / Error Messages */}
            {successMsg && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600">check_circle</span>
                    <p className="text-green-800 text-sm font-medium">{successMsg}</p>
                    <button onClick={() => setSuccessMsg(null)} className="ml-auto text-green-400 hover:text-green-600">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            )}
            {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-600">error</span>
                    <p className="text-red-800 text-sm font-medium">{errorMsg}</p>
                    <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            )}

            {/* Current Balance */}
            <div className="bg-gradient-to-br from-indigo-900 to-primary rounded-xl p-8 text-white mb-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="material-symbols-outlined text-[120px]">account_balance_wallet</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                    <span className="text-indigo-200">Current Balance</span>
                </div>
                <p className="text-4xl font-bold relative z-10">{formatPrice(reseller?.credit_balance || 0)}</p>
                <p className="text-indigo-200 mt-2 text-sm relative z-10">
                    Credits are used to generate work purchase keys at reseller discount prices
                </p>
            </div>

            {/* Credit Packages */}
            <div className="mb-8">
                <h2 className="text-slate-700 text-xl font-bold mb-4">Select a Credit Package</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packages.map((pkg) => (
                        <button
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg.id)}
                            className={`p-6 rounded-xl border-2 transition-all text-left relative bg-white ${selectedPackage === pkg.id
                                ? "border-primary bg-primary/5"
                                : "border-slate-100 hover:border-text-secondary-light"
                                }`}
                        >
                            {pkg.is_popular && (
                                <span className="absolute -top-2.5 right-4 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                                    Popular
                                </span>
                            )}
                            <p className="text-sm font-medium text-slate-500 mb-1">{pkg.name}</p>
                            <p className="text-3xl font-bold text-slate-700">{formatPrice(pkg.price)}</p>
                            {pkg.bonus_credits > 0 && (
                                <div className="mt-2 flex items-center gap-1 text-green-600">
                                    <span className="material-symbols-outlined text-sm">add_circle</span>
                                    <span className="text-sm font-medium">+{formatPrice(pkg.bonus_credits)} bonus</span>
                                </div>
                            )}
                            <p className="text-xs text-slate-500 mt-2">
                                Total: {formatPrice(pkg.credits + pkg.bonus_credits)}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Purchase Summary */}
            {selectedPackage && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6 max-w-md">
                    {(() => {
                        const pkg = packages.find(p => p.id === selectedPackage);
                        if (!pkg) return null;
                        const totalCredits = pkg.credits + pkg.bonus_credits;
                        return (
                            <>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Package</span>
                                        <span className="font-medium text-slate-700">{pkg.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Credits</span>
                                        <span className="font-medium text-slate-700">{formatPrice(pkg.credits)}</span>
                                    </div>
                                    {pkg.bonus_credits > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Bonus</span>
                                            <span className="font-medium">+{formatPrice(pkg.bonus_credits)}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-border-light"></div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-slate-700">Total Credits</span>
                                        <span className="font-bold text-primary">{formatPrice(totalCredits)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg pt-2 mt-2 border-t border-slate-100">
                                        <span className="font-bold text-slate-700">Price</span>
                                        <span className="font-bold text-slate-700">{formatPrice(pkg.price)}</span>
                                    </div>
                                </div>
                                <Link
                                    href={`/billing/checkout?package=${pkg.id}`}
                                    className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                                    Proceed to Checkout
                                </Link>
                            </>
                        );
                    })()}
                </div>
            )}
        </>
    );
}

export default function BillingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <BillingContent />
        </Suspense>
    );
}
