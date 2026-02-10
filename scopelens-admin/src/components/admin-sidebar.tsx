"use client";

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRole } from "@/lib/role-context";

const allNavItems = [
    { title: "Overview", url: "/", icon: "dashboard" },
    { title: "Users", url: "/users", icon: "group" },
    { title: "Plans", url: "/plans", icon: "credit_card" },
    { title: "AI Detection", url: "/ai-detection", icon: "smart_toy" },
    { title: "Analytics", url: "/analytics", icon: "analytics" },
    { title: "Resellers", url: "/resellers", icon: "handshake" },
    { title: "Work Purchases", url: "/licenses", icon: "key" },
    { title: "Support", url: "/support", icon: "support_agent" },
    { title: "System", url: "/system", icon: "monitoring" },
    { title: "Settings", url: "/settings", icon: "settings" },
];

const managerAllowedUrls = ["/licenses", "/ai-detection"];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { role } = useRole();

    const navItems = role === "manager"
        ? allNavItems.filter((item) => managerAllowedUrls.includes(item.url))
        : allNavItems;

    const roleLabel = role === "manager" ? "Manager" : "Administrator";
    const avatarInitials = role === "manager" ? "MG" : "AD";
    const badgeText = role === "manager" ? "Manager" : "Admin";

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <Sidebar>
            <SidebarHeader className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <img src="/icon.svg" alt="ScopeLens" className="w-10 h-10" />
                    <span className="text-xl font-bold">ScopeLens</span>
                    <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">{badgeText}</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Management</SidebarGroupLabel>
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
            <SidebarFooter className="p-4 border-t border-border">
                <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-destructive text-destructive-foreground">{avatarInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{roleLabel}</span>
                        <span className="text-xs text-muted-foreground">{roleLabel}</span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-lg h-9 px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Logout</span>
                </button>
            </SidebarFooter>
        </Sidebar>
    );
}

