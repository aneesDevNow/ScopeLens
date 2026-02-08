"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ResellerProfile {
    company_name: string | null;
    credit_balance: number;
    referral_code: string;
    status: string;
}

const navItems = [
    { title: "Dashboard", url: "/dashboard", icon: "dashboard" },
    { title: "Generate Keys", url: "/keys", icon: "vpn_key" },
    { title: "My Keys", url: "/keys/history", icon: "history" },
    { title: "Buy Credits", url: "/billing", icon: "account_balance_wallet" },
    { title: "Settings", url: "/settings", icon: "settings" },
];

export function AppSidebar() {
    const pathname = usePathname();
    const [profile, setProfile] = useState<ResellerProfile | null>(null);

    useEffect(() => {
        async function fetchResellerData() {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.reseller);
                }
            } catch (err) {
                console.error("Error fetching reseller data:", err);
            }
        }
        fetchResellerData();
    }, []);

    const displayName = profile?.company_name || "Reseller";
    const initials = displayName.substring(0, 2).toUpperCase();

    return (
        <Sidebar>
            <SidebarHeader className="p-4 border-b">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <img src="/icon.svg" alt="Scope Lens" className="w-10 h-10" />
                    <span className="text-xl font-bold text-gray-900">Scope Lens</span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Reseller Portal</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => {
                                const isActive = pathname === item.url ||
                                    (item.url !== "/dashboard" && pathname.startsWith(item.url) && item.url !== "/keys") ||
                                    (item.url === "/keys" && pathname === "/keys");
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={isActive}>
                                            <Link href={item.url}>
                                                <span className="material-symbols-outlined">{item.icon}</span>
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Credit Balance Card */}
                <SidebarGroup>
                    <SidebarGroupLabel>Balance</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <div className="mx-2 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-blue-600 text-lg">account_balance_wallet</span>
                                <span className="text-xs text-gray-500">Credits</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">
                                ${profile?.credit_balance?.toLocaleString() || "0"}
                            </p>
                            <Link
                                href="/billing"
                                className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Top Up
                                <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </Link>
                        </div>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{displayName}</span>
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-blue-600 text-xs">verified</span>
                            <span className="text-xs text-muted-foreground">Verified Partner</span>
                        </div>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
