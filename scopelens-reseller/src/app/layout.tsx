import type { Metadata } from "next";
import "./globals.css";
import LayoutInner from "./layout-inner";

export const metadata: Metadata = {
  title: "ScopeLens | Reseller Portal",
  description: "ScopeLens Reseller Partner Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-700 font-display h-screen flex overflow-hidden">
        <LayoutInner>{children}</LayoutInner>
      </body>
    </html>
  );
}
