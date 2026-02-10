"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [tokenReady, setTokenReady] = useState(false);

    useEffect(() => {
        // Check for PKCE code in query params
        const code = searchParams.get("code");
        if (code) {
            setTokenReady(true);
            return;
        }

        // Check for tokens in URL hash (implicit flow)
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");
            if (accessToken && refreshToken) {
                sessionStorage.setItem("reset_access_token", accessToken);
                sessionStorage.setItem("reset_refresh_token", refreshToken);
                setTokenReady(true);
                window.history.replaceState(null, "", "/reset-password");
            }
        } else {
            const stored = sessionStorage.getItem("reset_access_token");
            if (stored) setTokenReady(true);
        }
    }, [searchParams]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const accessToken = sessionStorage.getItem("reset_access_token");
            const refreshToken = sessionStorage.getItem("reset_refresh_token");
            const code = searchParams.get("code");

            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password,
                    code,
                    access_token: accessToken,
                    refresh_token: refreshToken,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to reset password");
                return;
            }

            sessionStorage.removeItem("reset_access_token");
            sessionStorage.removeItem("reset_refresh_token");
            setSuccess(true);
            setTimeout(() => router.push("/login"), 3000);
        } catch {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md bg-card rounded-lg border shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Password Updated!</h2>
                    <p className="text-muted-foreground mb-4">Your password has been reset. Redirecting to login...</p>
                    <Link href="/login" className="text-primary font-semibold hover:underline">
                        Go to Login →
                    </Link>
                </div>
            </div>
        );
    }

    if (!tokenReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md bg-card rounded-lg border shadow-sm p-8 text-center">
                    <p className="text-muted-foreground mb-4">Invalid or expired reset link. Please request a new one.</p>
                    <Link href="/forgot-password" className="text-primary font-semibold hover:underline">
                        Request new reset link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md bg-card rounded-lg border shadow-sm p-8">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <img src="/icon.svg" alt="ScopeLens" className="w-12 h-12" />
                    <span className="text-2xl font-bold">ScopeLens</span>
                </div>

                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold mb-1">Set New Password</h1>
                    <p className="text-muted-foreground text-sm">Enter your new password below</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Confirm Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 w-full"
                    >
                        <span className="material-symbols-outlined mr-2 text-[18px]">lock_reset</span>
                        {loading ? "Updating..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
