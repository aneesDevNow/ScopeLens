"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
    { title: "Upload Hub", url: "/scan", icon: "cloud_upload" },
    { title: "File History", url: "/files", icon: "folder_open" },
    { title: "Plans & Usage", url: "/plans", icon: "credit_card" },
    { title: "Settings", url: "/settings", icon: "settings" },
];

export function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [planName, setPlanName] = useState("Free");
    const [loggingOut, setLoggingOut] = useState(false);

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

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
        } catch (err) {
            console.error("Logout failed:", err);
            setLoggingOut(false);
        }
    };

    const displayName = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User"
        : "Loading...";

    const initials = profile
        ? `${(profile.first_name || "U")[0]}${(profile.last_name || "")[0] || ""}`.toUpperCase()
        : "...";

    return (
        <Sidebar>
            <SidebarHeader className="p-4 border-b">
                <Link href="/scan" className="flex items-center gap-3">
                    <img src="/icon.svg" alt="ScopeLens" className="w-10 h-10" />
                    <span className="text-xl font-bold text-slate-700">ScopeLens</span>
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
                                            <span className="material-symbols-outlined text-slate-700">{item.icon}</span>
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
                <div className="flex items-center justify-between">
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
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        title="Sign out"
                        className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
