"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { RoleProvider } from "@/lib/role-context";
import { usePathname } from "next/navigation";

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

  // Don't show the sidebar on login or auth pages
  const isLoginPage = pathname === "/login";
  const isAuthRoute = pathname?.startsWith("/auth/");
  const isForgotPassword = pathname === "/forgot-password";
  const isResetPassword = pathname === "/reset-password";
  const isStandalonePage = isLoginPage || isAuthRoute || isForgotPassword || isResetPassword;

  return (
    <html lang="en">
      <head>
        <title>ScopeLens Admin</title>
        <meta name="description" content="Admin Portal for ScopeLens" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {isStandalonePage ? (
          <main className="flex-1 bg-background">
            {children}
          </main>
        ) : (
          <RoleProvider>
            <SidebarProvider>
              <AdminSidebar />
              <main className="flex-1 bg-background">
                {children}
              </main>
            </SidebarProvider>
          </RoleProvider>
        )}
      </body>
    </html>
  );
}
