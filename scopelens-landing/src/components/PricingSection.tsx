"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const PKR_RATE = 280;

interface Plan {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    price_yearly: number | null;
    scans_per_day: number;
    features: Record<string, boolean>;
    is_active: boolean;
}

function getPlanStyle(slug: string, index: number) {
    const isPopular = slug === "professional" || index === 2;
    return {
        isPopular,
        cardClass: isPopular
            ? "bg-gradient-to-b from-blue-600 to-blue-700 rounded-2xl p-8 shadow-2xl shadow-blue-500/30 relative transform md:scale-105"
            : "bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100",
        titleClass: isPopular ? "text-xl font-bold text-white mb-2" : "text-xl font-bold text-slate-700 mb-2",
        priceClass: isPopular ? "text-4xl font-bold text-white" : "text-4xl font-bold text-slate-700",
        periodClass: isPopular ? "text-blue-200" : "text-slate-500",
        descClass: isPopular ? "text-blue-200 mt-2" : "text-slate-500 mt-2",
        checkBg: isPopular ? "w-5 h-5 bg-white/20 rounded-full flex items-center justify-center" : "w-5 h-5 bg-green-100 rounded-full flex items-center justify-center",
        checkIcon: isPopular ? "w-3 h-3 text-white" : "w-3 h-3 text-green-600",
        featureText: isPopular ? "text-white" : "text-slate-600",
        buttonClass: isPopular
            ? "w-full py-3.5 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg"
            : "w-full py-3.5 text-slate-600 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all",
        buttonText: slug === "free" ? "Get Started" : isPopular ? `Upgrade to ${slug === "professional" ? "Pro" : slug}` : "Choose Plan",
    };
}

const planDescriptions: Record<string, string> = {
    free: "For individuals and students",
    starter: "For regular users",
    professional: "For professional educators",
    institution: "For institutions",
};

function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
}

function setCookieValue(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function PricingSection({ plans }: { plans: Plan[] }) {
    const [currency, setCurrency] = useState<"USD" | "PKR">("USD");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function detectLocation() {
            try {
                // 1. Check localStorage for manual preference
                const saved = localStorage.getItem("preferred_currency");
                if (saved === "PKR" || saved === "USD") {
                    setCurrency(saved);
                    setIsLoading(false);
                    return;
                }

                // 2. Check cookie for cached country
                const cachedCountry = getCookie("user_country");
                if (cachedCountry) {
                    if (cachedCountry === "PK") setCurrency("PKR");
                    setIsLoading(false);
                    return;
                }

                // 3. Detect via IP API
                const res = await fetch("https://api.country.is/", { signal: AbortSignal.timeout(5000) });
                if (res.ok) {
                    const data = await res.json();
                    const country = data.country || "US";
                    setCookieValue("user_country", country, 7);
                    if (country === "PK") setCurrency("PKR");
                }
            } catch {
                // Default to USD
            } finally {
                setIsLoading(false);
            }
        }
        detectLocation();
    }, []);

    function formatPrice(amount: number): string {
        if (currency === "PKR") {
            const pkrAmount = Math.round(amount * PKR_RATE);
            return `Rs. ${pkrAmount.toLocaleString()}`;
        }
        return amount === 0 ? "$0" : `$${Math.round(amount)}`;
    }

    function handleCurrencySwitch(c: "USD" | "PKR") {
        setCurrency(c);
        localStorage.setItem("preferred_currency", c);
    }

    return (
        <section id="pricing" className="py-24 bg-gradient-to-b from-slate-50 to-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full mb-4">Pricing</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-700 mb-6">Simple, Transparent Pricing</h2>
                    <p className="text-xl text-slate-500 mb-6">Choose the plan that fits your needs</p>

                    {/* Currency Switcher */}
                    <div className="flex items-center justify-center gap-1 bg-slate-100 rounded-lg p-1 w-fit mx-auto">
                        <button
                            onClick={() => handleCurrencySwitch("USD")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${currency === "USD"
                                ? "bg-white text-slate-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-600"
                                }`}
                        >
                            USD $
                        </button>
                        <button
                            onClick={() => handleCurrencySwitch("PKR")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${currency === "PKR"
                                ? "bg-white text-slate-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-600"
                                }`}
                        >
                            PKR Rs.
                        </button>
                    </div>
                </div>
                <div className={`grid gap-8 max-w-6xl mx-auto ${plans.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
                    {plans.map((plan, index) => {
                        const style = getPlanStyle(plan.slug, index);
                        const features = plan.features ? Object.keys(plan.features).filter(k => plan.features[k]) : [];

                        return (
                            <div key={plan.id} className={`${style.cardClass} transition-all duration-300 ${isLoading ? "opacity-70" : "opacity-100"}`}>
                                {style.isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
                                        Most Popular
                                    </div>
                                )}
                                <div className="mb-6">
                                    <h3 className={style.titleClass}>{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className={style.priceClass}>
                                            {formatPrice(plan.price_monthly)}
                                        </span>
                                        <span className={style.periodClass}>/mo</span>
                                    </div>
                                    <p className={style.descClass}>{planDescriptions[plan.slug] || `${plan.scans_per_day} scans/day`}</p>
                                </div>
                                <ul className="space-y-4 mb-8">
                                    <li className="flex items-center gap-3">
                                        <div className={style.checkBg}>
                                            <svg className={style.checkIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className={style.featureText}>{plan.scans_per_day} scans per day</span>
                                    </li>
                                    {features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3">
                                            <div className={style.checkBg}>
                                                <svg className={style.checkIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className={style.featureText}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link href={plan.slug === "free" ? "/signup" : `/signup?plan=${plan.slug}`}>
                                    <button className={style.buttonClass}>
                                        {style.buttonText}
                                    </button>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
