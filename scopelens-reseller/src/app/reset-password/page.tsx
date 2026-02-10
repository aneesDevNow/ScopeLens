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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-700 mb-2">Password Updated!</h2>
                        <p className="text-slate-500 mb-4">Your password has been reset. Redirecting to login...</p>
                        <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                            Go to Login →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!tokenReady) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center">
                        <p className="text-slate-600 mb-4">Invalid or expired reset link. Please request a new one.</p>
                        <Link href="/forgot-password" className="text-blue-600 font-semibold hover:text-blue-700">
                            Request new reset link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-8 h-8">
                                <circle cx="100" cy="88" r="45" fill="none" stroke="white" strokeWidth="8" opacity="0.95" />
                                <circle cx="100" cy="88" r="32" fill="none" stroke="white" strokeWidth="4" opacity="0.7" />
                                <rect x="132" y="118" width="14" height="45" rx="7" fill="white" opacity="0.95" transform="rotate(45, 139, 140)" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-slate-700">ScopeLens</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-700 mb-2">Set New Password</h1>
                        <p className="text-slate-500">Enter your new password below</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-slate-600">New Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-600">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Updating...
                                </span>
                            ) : (
                                "Reset Password"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
