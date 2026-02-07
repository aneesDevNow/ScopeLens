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
}

interface Subscription {
    plan: {
        name: string;
    } | null;
}

const navItems = [
    { title: "Upload Hub", url: "/", icon: "cloud_upload" },
    { title: "File History", url: "/files", icon: "folder_open" },
    { title: "Reports", url: "/reports", icon: "assessment" },
    { title: "Plans & Usage", url: "/plans", icon: "credit_card" },
    { title: "Settings", url: "/settings", icon: "settings" },
];

const resellerItems = [
    { title: "Reseller Dashboard", url: "/reseller", icon: "handshake" },
];

export function AppSidebar() {
    const pathname = usePathname();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [planName, setPlanName] = useState("Free");

    useEffect(() => {
        async function fetchUserData() {
            try {
                const [profileRes, subRes] = await Promise.all([
                    fetch("/api/profile"),
                    fetch("/api/subscription"),
                ]);

                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setProfile(data.profile);
                }

                if (subRes.ok) {
                    const data = await subRes.json();
                    setPlanName(data.plan?.name || "Free");
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            }
        }

        fetchUserData();
    }, []);

    const displayName = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User"
        : "Loading...";

    const initials = profile
        ? `${(profile.first_name || "U")[0]}${(profile.last_name || "")[0] || ""}`.toUpperCase()
        : "...";

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
                    <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
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
                <SidebarGroup>
                    <SidebarGroupLabel>Partner</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {resellerItems.map((item) => (
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
                        <span className="text-xs text-muted-foreground">{planName} Plan</span>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
