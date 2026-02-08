"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ResellerData {
    credit_balance: number;
    company_name: string;
}

interface CreditPackage {
    id: string;
    amount: number;
    bonus: number;
    label: string;
    popular?: boolean;
}

const creditPackages: CreditPackage[] = [
    { id: "pkg_25", amount: 25, bonus: 0, label: "Starter" },
    { id: "pkg_50", amount: 50, bonus: 5, label: "Basic" },
    { id: "pkg_100", amount: 100, bonus: 15, label: "Standard", popular: true },
    { id: "pkg_250", amount: 250, bonus: 50, label: "Pro" },
    { id: "pkg_500", amount: 500, bonus: 125, label: "Enterprise" },
];

export default function BillingPage() {
    const { formatPrice } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [reseller, setReseller] = useState<ResellerData | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [purchasing, setPurchasing] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setReseller(data.reseller);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    async function handlePurchase() {
        if (!selectedPackage || purchasing) return;
        setPurchasing(true);
        setSuccessMsg(null);
        setErrorMsg(null);

        try {
            const res = await fetch("/api/billing/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageId: selectedPackage }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || "Purchase failed");
                return;
            }

            // Update local balance immediately
            setReseller(prev => prev ? { ...prev, credit_balance: data.credit_balance } : prev);
            setSuccessMsg(`Successfully purchased ${data.package} package! +${formatPrice(data.credits_added)} credits added.`);
            setSelectedPackage(null);
        } catch (err) {
            console.error("Purchase error:", err);
            setErrorMsg("Network error — please try again");
        } finally {
            setPurchasing(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-secondary-light">Loading billing...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-text-light text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                    Credit History
                </h1>
                <p className="text-text-secondary-light text-base font-normal">
                    Purchase credits to generate license keys for your clients
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
                    Credits are used to generate license keys at reseller discount prices
                </p>
            </div>

            {/* Credit Packages */}
            <div className="mb-8">
                <h2 className="text-text-light text-xl font-bold mb-4">Select a Credit Package</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {creditPackages.map((pkg) => (
                        <button
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg.id)}
                            className={`p-6 rounded-xl border-2 transition-all text-left relative bg-surface-light ${selectedPackage === pkg.id
                                ? "border-primary bg-primary/5"
                                : "border-border-light hover:border-text-secondary-light"
                                }`}
                        >
                            {pkg.popular && (
                                <span className="absolute -top-2.5 right-4 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                                    Popular
                                </span>
                            )}
                            <p className="text-sm font-medium text-text-secondary-light mb-1">{pkg.label}</p>
                            <p className="text-3xl font-bold text-text-light">{formatPrice(pkg.amount)}</p>
                            {pkg.bonus > 0 && (
                                <div className="mt-2 flex items-center gap-1 text-green-600">
                                    <span className="material-symbols-outlined text-sm">add_circle</span>
                                    <span className="text-sm font-medium">+{formatPrice(pkg.bonus)} bonus credits</span>
                                </div>
                            )}
                            <p className="text-xs text-text-secondary-light mt-2">
                                Total: {formatPrice(pkg.amount + pkg.bonus)} credits
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Purchase Summary */}
            {selectedPackage && (
                <div className="bg-surface-light rounded-xl border border-border-light shadow-sm p-6 max-w-md">
                    {(() => {
                        const pkg = creditPackages.find(p => p.id === selectedPackage);
                        if (!pkg) return null;
                        return (
                            <>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary-light">Package</span>
                                        <span className="font-medium text-text-light">{pkg.label}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary-light">Credits</span>
                                        <span className="font-medium text-text-light">{formatPrice(pkg.amount)}</span>
                                    </div>
                                    {pkg.bonus > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Bonus</span>
                                            <span className="font-medium">+{formatPrice(pkg.bonus)}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-border-light"></div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-text-light">Total Credits</span>
                                        <span className="font-bold text-primary">{formatPrice(pkg.amount + pkg.bonus)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handlePurchase}
                                    disabled={purchasing}
                                    className="w-full h-10 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {purchasing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                                            Purchase {formatPrice(pkg.amount)}
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-text-secondary-light text-center mt-3">
                                    Auto-confirmed for development
                                </p>
                            </>
                        );
                    })()}
                </div>
            )}
        </>
    );
}
