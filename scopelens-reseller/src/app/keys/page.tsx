"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import Link from "next/link";

interface Plan {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    reseller_price_monthly: number;
    reseller_discount_percent: number;
    scans_per_month: number;
}

interface GeneratedKey {
    id: string;
    key_code: string;
    status: string;
    duration_days: number;
    created_at: string;
}

export default function GenerateKeysPage() {
    const { formatPrice } = useCurrency();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string>("");
    const [quantity, setQuantity] = useState(1);
    const [durationDays, setDurationDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generatedKeys, setGeneratedKeys] = useState<GeneratedKey[]>([]);
    const [creditBalance, setCreditBalance] = useState(0);
    const [error, setError] = useState("");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [plansRes, profileRes] = await Promise.all([
                    fetch("/api/plans"),
                    fetch("/api/profile"),
                ]);
                if (plansRes.ok) {
                    const data = await plansRes.json();
                    setPlans((data.plans || []).filter((p: Plan) => Number(p.price_monthly) > 0));
                }
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setCreditBalance(data.reseller?.credit_balance || 0);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    const unitCost = selectedPlanData ? Number(selectedPlanData.reseller_price_monthly) : 0;
    const totalCost = unitCost * quantity;
    const retailTotal = selectedPlanData ? Number(selectedPlanData.price_monthly) * quantity : 0;
    const savings = retailTotal - totalCost;

    const handleGenerate = async () => {
        if (!selectedPlan) { setError("Please select a plan"); return; }
        setGenerating(true);
        setError("");
        setGeneratedKeys([]);
        try {
            const res = await fetch("/api/keys/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan_id: selectedPlan, quantity, duration_days: durationDays }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Failed to generate keys"); return; }
            setGeneratedKeys(data.keys || []);
            setCreditBalance(data.new_balance);
        } catch {
            setError("Failed to generate keys");
        } finally {
            setGenerating(false);
        }
    };

    const copyKey = async (keyCode: string) => {
        await navigator.clipboard.writeText(keyCode);
        setCopiedKey(keyCode);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const copyAllKeys = async () => {
        const all = generatedKeys.map(k => k.key_code).join("\n");
        await navigator.clipboard.writeText(all);
        setCopiedKey("all");
        setTimeout(() => setCopiedKey(null), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-secondary-light">Loading plans...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-text-light text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                        Key Management
                    </h1>
                    <p className="text-text-secondary-light text-base font-normal">
                        Generate license keys at discounted reseller prices
                    </p>
                </div>
                <Link
                    href="/keys/history"
                    className="flex items-center gap-2 px-4 py-2.5 border border-border-light rounded-lg text-text-light text-sm font-bold hover:bg-background-light transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    View History
                </Link>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Plan Selection */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface-light rounded-xl border border-border-light shadow-sm p-6">
                        <h2 className="text-text-light text-lg font-bold mb-4">Select Plan</h2>
                        <div className="grid gap-3">
                            {plans.map((plan) => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${selectedPlan === plan.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border-light hover:border-text-secondary-light"
                                        }`}
                                >
                                    <div>
                                        <p className="font-semibold text-text-light">{plan.name}</p>
                                        <p className="text-sm text-text-secondary-light">{plan.scans_per_month} scans/month</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary">{formatPrice(Number(plan.reseller_price_monthly))}/key</p>
                                        <p className="text-sm text-text-secondary-light line-through">{formatPrice(Number(plan.price_monthly))}</p>
                                        <span className="text-xs text-green-600 font-medium">Save {plan.reseller_discount_percent}%</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity & Duration */}
                    <div className="bg-surface-light rounded-xl border border-border-light shadow-sm p-6">
                        <h2 className="text-text-light text-lg font-bold mb-4">Configuration</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-text-secondary-light">Quantity (1-20)</label>
                                <input
                                    type="number" min={1} max={20} value={quantity}
                                    onChange={(e) => setQuantity(Math.min(20, Math.max(1, Number(e.target.value))))}
                                    className="bg-background-light border border-border-light rounded-lg px-3 py-2.5 text-sm text-text-light focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-text-secondary-light">Key Expiration</label>
                                <div className="flex gap-2">
                                    {[{ label: "30 Days", value: 30 }, { label: "90 Days", value: 90 }, { label: "1 Year", value: 365 }].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setDurationDays(opt.value)}
                                            className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-colors ${durationDays === opt.value
                                                    ? "bg-primary/10 text-primary border border-primary/20"
                                                    : "border border-border-light text-text-secondary-light hover:bg-background-light"
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

                    {/* Generated Keys */}
                    {generatedKeys.length > 0 && (
                        <div className="bg-surface-light rounded-xl border border-green-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-green-700 text-lg font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined">check_circle</span>
                                    Keys Generated!
                                </h2>
                                <button onClick={copyAllKeys} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 text-sm">
                                    <span className="material-symbols-outlined text-lg">{copiedKey === "all" ? "check" : "content_copy"}</span>
                                    {copiedKey === "all" ? "Copied!" : "Copy All"}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {generatedKeys.map((key) => (
                                    <div key={key.id} className="flex items-center justify-between p-3 bg-background-light rounded-lg">
                                        <code className="font-mono text-sm font-medium text-text-light">{key.key_code}</code>
                                        <button onClick={() => copyKey(key.key_code)} className="p-2 hover:bg-border-light rounded-lg transition-all">
                                            <span className="material-symbols-outlined text-text-secondary-light text-lg">{copiedKey === key.key_code ? "check" : "content_copy"}</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cost Summary */}
                <div className="space-y-6">
                    <div className="bg-surface-light rounded-xl border border-border-light shadow-sm p-6 sticky top-8">
                        <h2 className="text-text-light text-lg font-bold mb-6">Order Summary</h2>
                        {selectedPlanData ? (
                            <>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary-light">Plan</span>
                                        <span className="font-medium text-text-light">{selectedPlanData.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary-light">Price per key</span>
                                        <span className="font-medium text-text-light">{formatPrice(unitCost)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary-light">Quantity</span>
                                        <span className="font-medium text-text-light">× {quantity}</span>
                                    </div>
                                    <div className="h-px bg-border-light"></div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary-light">Retail Value</span>
                                        <span className="text-text-secondary-light line-through">{formatPrice(retailTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Your Savings</span>
                                        <span className="font-medium">-{formatPrice(savings)}</span>
                                    </div>
                                    <div className="h-px bg-border-light"></div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-text-light">Total Cost</span>
                                        <span className="text-xl font-bold text-primary">{formatPrice(totalCost)}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-primary">Your Balance</span>
                                        <span className="font-bold text-primary">{formatPrice(creditBalance)}</span>
                                    </div>
                                    {creditBalance < totalCost && (
                                        <p className="text-xs text-red-600 mt-1">Insufficient credits.</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-text-secondary-light text-center py-8">Select a plan to see pricing</p>
                        )}
                        <button
                            onClick={handleGenerate}
                            disabled={!selectedPlan || generating || creditBalance < totalCost}
                            className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-md shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {generating ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                                    Generate {quantity} Key{quantity > 1 ? "s" : ""}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
