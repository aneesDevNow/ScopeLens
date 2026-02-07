"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState("Authenticating...");

    useEffect(() => {
        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");

        if (accessToken && refreshToken) {
            const supabase = createClient();

            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            }).then(({ error }) => {
                if (error) {
                    setStatus("Authentication failed");
                    console.error("Auth error:", error);
                } else {
                    setStatus("Success! Redirecting...");
                    router.push("/");
                }
            });
        } else {
            setStatus("Missing authentication tokens");
            setTimeout(() => {
                router.push("/");
            }, 2000);
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">{status}</p>
            </div>
        </div>
    );
}
