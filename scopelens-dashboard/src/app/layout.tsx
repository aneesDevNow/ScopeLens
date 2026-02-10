"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { usePathname } from "next/navigation";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Don't show the main sidebar on landing, login, or auth pages
  const isLandingPage = pathname === "/";
  const isAuthRoute = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password" || pathname?.startsWith("/auth/");
  const isCheckoutRoute = pathname === "/checkout" || pathname?.startsWith("/checkout/");
  const isStandalonePage = isLandingPage || isAuthRoute || isCheckoutRoute;

  return (
    <html lang="en">
      <head>
        <title>ScopeLens Dashboard</title>
        <meta name="description" content="AI Content Detection Dashboard" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <CurrencyProvider>
          {isStandalonePage ? (
            // Standalone pages (reseller, login, auth) — no main sidebar
            <main className="flex-1 bg-background">
              {children}
            </main>
          ) : (
            // Regular dashboard pages with sidebar
            <SidebarProvider>
              <AppSidebar />
              <main className="flex-1 bg-background">
                {children}
              </main>
            </SidebarProvider>
          )}
        </CurrencyProvider>
      </body>
    </html>
  );
}
