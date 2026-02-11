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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    credit_balance: number;
}

const navItems = [
    { title: "Dashboard", url: "/", icon: "dashboard" },
    { title: "Buy Credits", url: "/billing", icon: "add_card" },
    { title: "Generate Keys", url: "/keys", icon: "vpn_key" },
    { title: "Key History", url: "/keys/history", icon: "history" },
    { title: "Settings", url: "/settings", icon: "settings" },
];

export function AppSidebar() {
    const pathname = usePathname();
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
        async function fetchUserData() {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile({
                        ...data.profile,
                        credit_balance: data.reseller?.credit_balance || 0
                    });
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            }
        }

        fetchUserData();
    }, []);

    const displayName = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Reseller"
        : "Loading...";

    const initials = profile
        ? `${(profile.first_name || "R")[0]}${(profile.last_name || "")[0] || ""}`.toUpperCase()
        : "...";

    // Format currency (assuming USD for now, can use context if needed but keeping it simple for sidebar)
    const formattedBalance = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(profile?.credit_balance || 0);

    return (
        <Sidebar>
            <SidebarHeader className="p-4 border-b">
                <Link href="/" className="flex items-center gap-3">
                    <img src="/icon.svg" alt="Scope Lens" className="w-10 h-10" />
                    <span className="text-xl font-bold text-gray-900">Scope Lens</span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Reseller Portal</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                                        <Link href={item.url}>
                                            <span className="material-symbols-outlined">{item.icon}</span>
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{displayName}</span>
                        <span className="text-xs text-muted-foreground">Balance: {formattedBalance}</span>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
