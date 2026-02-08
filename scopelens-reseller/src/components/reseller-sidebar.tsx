"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState, useEffect } from "react";

interface NavItem {
    label: string;
    href: string;
    icon: string;
}

const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { label: "My Customers", href: "/keys/history", icon: "group" },
    { label: "Credit History", href: "/billing", icon: "history" },
    { label: "Key Management", href: "/keys", icon: "vpn_key" },
    { label: "Settings", href: "/settings", icon: "settings" },
];

export default function ResellerSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<{ email: string; name: string } | null>(null);

    useEffect(() => {
        async function fetchUser() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser({
                    email: user.email || "",
                    name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
                });
            }
        }
        fetchUser();
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    };

    const initials = user?.name
        ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : "??";

    return (
        <aside className="w-64 flex-shrink-0 bg-surface-light border-r border-border-light flex flex-col h-full transition-colors duration-200">
            <div className="flex flex-col h-full justify-between p-4">
                <div className="flex flex-col gap-6">
                    {/* Branding */}
                    <div className="flex flex-col px-2 mt-2">
                        <h1 className="text-text-light text-lg font-bold leading-normal flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">deployed_code</span>
                            Reseller Portal
                        </h1>
                        <p className="text-text-secondary-light text-xs font-normal leading-normal mt-1">
                            Scope Lens Admin
                        </p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href === "/dashboard" && pathname === "/");
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-text-secondary-light hover:bg-background-light hover:text-text-light"
                                        }`}
                                >
                                    <span className={`material-symbols-outlined ${isActive ? "filled-icon" : ""}`}>
                                        {item.icon}
                                    </span>
                                    <p className={`text-sm leading-normal ${isActive ? "font-semibold" : "font-medium"}`}>
                                        {item.label}
                                    </p>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* User Info - Middle */}
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-background-light border border-border-light">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-white font-bold text-sm">
                        {initials}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <p className="text-text-light text-sm font-semibold truncate">
                            {user?.name || "Loading..."}
                        </p>
                        <p className="text-text-secondary-light text-xs truncate">
                            {user?.email || ""}
                        </p>
                    </div>
                </div>

                {/* Logout - Bottom */}
                <button
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-background-light hover:bg-border-light text-text-light text-sm font-bold leading-normal border border-border-light transition-colors mb-2"
                >
                    <span className="truncate">Logout</span>
                </button>
            </div>
        </aside>
    );
}
