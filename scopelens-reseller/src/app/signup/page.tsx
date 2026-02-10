"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function ScopeLensLogo() {
    return (
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-8 h-8">
                <circle cx="100" cy="88" r="45" fill="none" stroke="white" strokeWidth="8" opacity="0.95" />
                <circle cx="100" cy="88" r="32" fill="none" stroke="white" strokeWidth="4" opacity="0.7" />
                <circle cx="92" cy="80" r="8" fill="white" opacity="0.4" />
                <line x1="70" y1="78" x2="130" y2="78" stroke="white" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
                <line x1="75" y1="88" x2="125" y2="88" stroke="white" strokeWidth="3" opacity="0.8" strokeLinecap="round" />
                <line x1="70" y1="98" x2="130" y2="98" stroke="white" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
                <rect x="132" y="118" width="14" height="45" rx="7" fill="white" opacity="0.95" transform="rotate(45, 139, 140)" />
            </svg>
        </div>
    );
}

export default function SignupPage() {
    const [companyName, setCompanyName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

    // Auto-detect country on mount
    useEffect(() => {
        async function detectCountry() {
            try {
                const match = document.cookie.match(/(^| )user_country=([^;]+)/);
                if (match) {
                    setDetectedCountry(decodeURIComponent(match[2]));
                    return;
                }
                const res = await fetch("https://api.country.is/", { signal: AbortSignal.timeout(5000) });
                if (res.ok) {
                    const data = await res.json();
                    const country = data.country || "US";
                    setDetectedCountry(country);
                    const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
                    document.cookie = `user_country=${country}; expires=${expires}; path=/; SameSite=Lax`;
                }
            } catch {
                // Silently fail
            }
        }
        detectCountry();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, companyName, country: detectedCountry }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Signup failed");
                return;
            }

            setSuccess(true);
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
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-3">
                            <ScopeLensLogo />
                            <span className="text-2xl font-bold text-slate-700">ScopeLens</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-700 mb-2">Account Created!</h2>
                        <p className="text-slate-500 mb-6">
                            Your reseller account has been created for <strong className="text-slate-600">{email}</strong>. You can now sign in to your portal.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block w-full py-3 text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25"
                        >
                            Sign In Now
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3">
                        <ScopeLensLogo />
                        <span className="text-2xl font-bold text-slate-700">ScopeLens</span>
                    </div>
                </div>

                {/* Signup Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-700 mb-2">Create Reseller Account</h1>
                        <p className="text-slate-500">Start distributing ScopeLens licenses</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="companyName" className="text-sm font-medium text-slate-600">Company / Business Name</label>
                            <input
                                id="companyName"
                                type="text"
                                placeholder="Your Company"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-slate-600">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-slate-600">Password</label>
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
                                    Creating account...
                                </span>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>

                {/* Reseller Badge */}
                <div className="text-center mt-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Reseller Portal
                    </span>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-400 text-sm mt-6">
                    © {new Date().getFullYear()} ScopeLens. All rights reserved.
                </p>
            </div>
        </div>
    );
}
