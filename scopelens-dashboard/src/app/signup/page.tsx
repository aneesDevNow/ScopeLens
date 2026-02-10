"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();


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
            const supabase = createClient();
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                    },
                },
            });

            if (error) {
                setError(error.message);
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
                        <h2 className="text-xl font-bold text-slate-700 mb-2">Check your email</h2>
                        <p className="text-slate-500 mb-6">
                            We&apos;ve sent a confirmation link to <strong className="text-slate-600">{email}</strong>. Click the link to activate your account.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block w-full py-3 text-center bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-all"
                        >
                            Back to Sign In
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
                        <h1 className="text-2xl font-bold text-slate-700 mb-2">Create Account</h1>
                        <p className="text-slate-500">Start detecting AI content today</p>
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

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label htmlFor="firstName" className="text-sm font-medium text-slate-600">First Name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    placeholder="John"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="text-sm font-medium text-slate-600">Last Name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    placeholder="Doe"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
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

                {/* Footer */}
                <p className="text-center text-slate-400 text-sm mt-8">
                    © {new Date().getFullYear()} ScopeLens. All rights reserved.
                </p>
            </div>
        </div>
    );
}
