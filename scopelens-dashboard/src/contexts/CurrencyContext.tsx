"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface CurrencyContextType {
    currency: "USD" | "PKR";
    symbol: string;
    rate: number;
    isLoading: boolean;
    formatPrice: (usdAmount: number) => string;
    convertPrice: (usdAmount: number) => number;
    setCurrency: (currency: "USD" | "PKR") => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const PKR_RATE = 280; // 1 USD = 280 PKR (approximate rate)

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
}

function setCookieValue(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState<"USD" | "PKR">("USD");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        detectLocation();
    }, []);

    const detectLocation = async () => {
        try {
            // 1. Check localStorage first for manual user preference
            const savedCurrency = localStorage.getItem("preferred_currency");
            if (savedCurrency === "PKR" || savedCurrency === "USD") {
                setCurrency(savedCurrency);
                setIsLoading(false);
                return;
            }

            // 2. Try to get country from user profile (stored during signup)
            try {
                const profileRes = await fetch("/api/profile");
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    const country = profileData.country;
                    if (country === "PK") {
                        setCurrency("PKR");
                    }
                    setIsLoading(false);
                    return;
                }
            } catch {
                // Profile fetch failed (user not logged in) — fall through to IP detection
            }

            // 3. Check cookie for cached country (fallback for non-authenticated pages)
            const cachedCountry = getCookie("user_country");
            if (cachedCountry) {
                if (cachedCountry === "PK") {
                    setCurrency("PKR");
                }
                setIsLoading(false);
                return;
            }

            // 4. Detect location via IP (last resort fallback)
            const res = await fetch("https://api.country.is/", {
                signal: AbortSignal.timeout(5000),
            });

            if (res.ok) {
                const data = await res.json();
                const country = data.country || "US";

                // Save country to cookie (7-day expiry)
                setCookieValue("user_country", country, 7);

                if (country === "PK") {
                    setCurrency("PKR");
                }
            }
        } catch {
            // Silently default to USD
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetCurrency = (newCurrency: "USD" | "PKR") => {
        setCurrency(newCurrency);
        localStorage.setItem("preferred_currency", newCurrency);
    };

    const convertPrice = (usdAmount: number): number => {
        if (currency === "PKR") {
            return Math.round(usdAmount * PKR_RATE);
        }
        return usdAmount;
    };

    const formatPrice = (usdAmount: number): string => {
        const amount = convertPrice(usdAmount);
        if (currency === "PKR") {
            return `Rs. ${amount.toLocaleString()}`;
        }
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const value: CurrencyContextType = {
        currency,
        symbol: currency === "PKR" ? "Rs." : "$",
        rate: currency === "PKR" ? PKR_RATE : 1,
        isLoading,
        formatPrice,
        convertPrice,
        setCurrency: handleSetCurrency,
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error("useCurrency must be used within a CurrencyProvider");
    }
    return context;
}

// Currency switcher component
export function CurrencySwitcher({ className = "" }: { className?: string }) {
    const { currency, setCurrency, isLoading } = useCurrency();

    if (isLoading) return null;

    return (
        <div className={`flex items-center gap-1 bg-slate-100 rounded-lg p-1 ${className}`}>
            <button
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currency === "USD"
                    ? "bg-white text-slate-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-600"
                    }`}
            >
                USD $
            </button>
            <button
                onClick={() => setCurrency("PKR")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currency === "PKR"
                    ? "bg-white text-slate-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-600"
                    }`}
            >
                PKR Rs.
            </button>
        </div>
    );
}
