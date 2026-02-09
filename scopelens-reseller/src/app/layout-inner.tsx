"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

const STANDALONE_ROUTES = ["/login", "/signup", "/"];

export default function LayoutInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isStandalone = STANDALONE_ROUTES.includes(pathname);

    if (isStandalone) {
        return <CurrencyProvider><div className="w-full">{children}</div></CurrencyProvider>;
    }

    return (
        <CurrencyProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <div className="flex-1 overflow-y-auto w-full">
                        <div className="max-w-[1200px] mx-auto p-6 md:p-10 w-full">
                            {children}
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </CurrencyProvider>
    );
}
