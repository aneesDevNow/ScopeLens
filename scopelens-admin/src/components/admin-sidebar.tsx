"use client";

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

const navItems = [
    { title: "Overview", url: "/", icon: "dashboard" },
    { title: "Users", url: "/users", icon: "group" },
    { title: "Plans", url: "/plans", icon: "credit_card" },
    { title: "Analytics", url: "/analytics", icon: "analytics" },
    { title: "Resellers", url: "/resellers", icon: "handshake" },
    { title: "Licenses", url: "/licenses", icon: "key" },
    { title: "Support", url: "/support", icon: "support_agent" },
    { title: "System", url: "/system", icon: "monitoring" },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar>
            <SidebarHeader className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <img src="/icon.svg" alt="Scope Lens" className="w-10 h-10" />
                    <span className="text-xl font-bold">Scope Lens</span>
                    <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">Admin</span>
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
            <SidebarFooter className="p-4 border-t border-border">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-destructive text-destructive-foreground">AD</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">Admin User</span>
                        <span className="text-xs text-muted-foreground">admin@scopelens.com</span>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
