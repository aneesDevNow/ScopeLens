"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResellerLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOTP] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const supabase = createClient();

            // Try to sign in with password
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                throw signInError;
            }

            if (data.user) {
                // Check if user is a reseller
                const profileRes = await fetch("/api/reseller/profile");

                if (profileRes.ok) {
                    // User is a reseller, redirect to dashboard
                    router.push("/reseller/dashboard");
                } else {
                    // Not a reseller
                    setError("This account is not registered as a reseller. Please apply to become a reseller first.");
                    await supabase.auth.signOut();
                }
            }
        } catch (err) {
            setError((err as Error).message || "Failed to sign in");
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLink = async () => {
        if (!email) {
            setError("Please enter your email address");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const supabase = createClient();
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/reseller/dashboard`,
                },
            });

            if (otpError) throw otpError;

            setShowOTP(true);
        } catch (err) {
            setError((err as Error).message || "Failed to send magic link");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const supabase = createClient();
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: "email",
            });

            if (verifyError) throw verifyError;

            if (data.user) {
                // Check if user is a reseller
                const profileRes = await fetch("/api/reseller/profile");

                if (profileRes.ok) {
                    router.push("/reseller/dashboard");
                } else {
                    setError("This account is not registered as a reseller.");
                    await supabase.auth.signOut();
                }
            }
        } catch (err) {
            setError((err as Error).message || "Invalid verification code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl"></div>
            </div>

            {/* Login Card */}
            <div className="relative w-full max-w-md">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30">
                            <span className="material-symbols-outlined text-white text-3xl">storefront</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Reseller Portal</h1>
                    <p className="text-gray-400">Sign in to your reseller account</p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    {!showOTP ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">mail</span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        placeholder="you@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-xl shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">login</span>
                                        Sign In
                                    </>
                                )}
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/20"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-transparent text-gray-400">or</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleMagicLink}
                                disabled={loading}
                                className="w-full py-3.5 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">magic_button</span>
                                Sign in with Magic Link
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-5">
                            <div className="text-center mb-4">
                                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-purple-400 text-3xl">mark_email_read</span>
                                </div>
                                <p className="text-gray-300">We sent a verification code to</p>
                                <p className="text-white font-medium">{email}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOTP(e.target.value)}
                                    required
                                    maxLength={6}
                                    className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="000000"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length < 6}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-xl shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Verify & Sign In
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowOTP(false)}
                                className="w-full py-3 text-gray-400 hover:text-white transition-colors text-sm"
                            >
                                ← Back to login
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer Links */}
                <div className="mt-8 text-center space-y-4">
                    <p className="text-gray-400 text-sm">
                        Not a reseller yet?{" "}
                        <Link href="/reseller" className="text-purple-400 hover:text-purple-300 font-medium">
                            Apply to become a partner
                        </Link>
                    </p>
                    <p className="text-gray-500 text-sm">
                        <Link href="/" className="hover:text-gray-300 transition-colors">
                            ← Back to main dashboard
                        </Link>
                    </p>
                </div>

                {/* Features */}
                <div className="mt-10 grid grid-cols-3 gap-4">
                    {[
                        { icon: "trending_up", label: "20% Margins" },
                        { icon: "credit_card", label: "Credit System" },
                        { icon: "support_agent", label: "Priority Support" },
                    ].map((feature) => (
                        <div key={feature.label} className="text-center">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <span className="material-symbols-outlined text-purple-400">{feature.icon}</span>
                            </div>
                            <p className="text-xs text-gray-400">{feature.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
