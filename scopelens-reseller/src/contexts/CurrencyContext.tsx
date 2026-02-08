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

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState<"USD" | "PKR">("USD");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        detectLocation();
    }, []);

    const detectLocation = async () => {
        try {
            // Check localStorage first for user preference
            const savedCurrency = localStorage.getItem("preferred_currency");
            if (savedCurrency === "PKR" || savedCurrency === "USD") {
                setCurrency(savedCurrency);
                setIsLoading(false);
                return;
            }

            // Detect location via IP
            const res = await fetch("https://ipapi.co/json/", {
                signal: AbortSignal.timeout(5000),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.country_code === "PK") {
                    setCurrency("PKR");
                    localStorage.setItem("preferred_currency", "PKR");
                }
            }
        } catch {
            // Silently default to USD — IP detection may fail on localhost or restricted networks
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
        <div className={`flex items-center gap-1 bg-gray-100 rounded-lg p-1 ${className}`}>
            <button
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currency === "USD"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
            >
                USD $
            </button>
            <button
                onClick={() => setCurrency("PKR")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currency === "PKR"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
            >
                PKR Rs.
            </button>
        </div>
    );
}
