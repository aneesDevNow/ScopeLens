"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const resellerNav = [
    { icon: "dashboard", label: "Dashboard", href: "/reseller/dashboard" },
    { icon: "people", label: "Clients", href: "/reseller/clients" },
    { icon: "credit_card", label: "Billing", href: "/reseller/billing" },
    { icon: "bar_chart", label: "Reports", href: "/reseller/reports" },
    { icon: "settings", label: "Settings", href: "/reseller/settings" },
];

// Pages that don't require reseller auth / don't have sidebar
const publicResellerPages = ["/reseller/login", "/reseller"];

export default function ResellerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isReseller, setIsReseller] = useState<boolean | null>(null);
    const [creditBalance, setCreditBalance] = useState(0);

    // Check if current page is a public reseller page (no auth needed)
    const isPublicPage = publicResellerPages.includes(pathname);

    useEffect(() => {
        // Skip auth check for public pages
        if (isPublicPage) {
            setIsReseller(false); // Will render children without sidebar
            return;
        }

        const checkReseller = async () => {
            try {
                const res = await fetch("/api/reseller/profile");
                if (res.ok) {
                    const data = await res.json();
                    setIsReseller(true);
                    setCreditBalance(data.profile?.credit_balance || 0);
                } else if (res.status === 401) {
                    // Not authenticated - redirect to login
                    router.push("/reseller/login");
                } else {
                    // Authenticated but not a reseller
                    setIsReseller(false);
                }
            } catch {
                router.push("/reseller/login");
            }
        };
        checkReseller();
    }, [pathname, isPublicPage, router]);

    // For public pages (login, apply), just render children without layout
    if (isPublicPage) {
        return <>{children}</>;
    }

    // Show loading while checking
    if (isReseller === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading reseller panel...</p>
                </div>
            </div>
        );
    }

    // If not a reseller (but authenticated), show the "Become a Reseller" page
    if (!isReseller) {
        return <>{children}</>;
    }

    // Full reseller layout with sidebar
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Reseller Sidebar - Matching User Panel Style */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xl">storefront</span>
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">Reseller Panel</h2>
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                                <span className="material-symbols-outlined text-sm">verified</span>
                                Verified Partner
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {resellerNav.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/reseller/dashboard" && pathname.startsWith(item.href));
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Credit Balance Card */}
                <div className="p-4 border-t border-gray-100">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-600 text-lg">account_balance_wallet</span>
                            </div>
                            <span className="text-sm text-gray-600">Credit Balance</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900" id="sidebar-credit-balance">${creditBalance.toLocaleString()}</p>
                        <Link
                            href="/reseller/billing"
                            className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                            Add Credits
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                    </div>
                </div>

                {/* Back to Dashboard */}
                <div className="p-4 border-t border-gray-100">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Back to Dashboard
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
