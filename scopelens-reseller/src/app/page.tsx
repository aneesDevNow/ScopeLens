"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ResellerLandingPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch("/api/auth/check");
                if (res.ok) {
                    const data = await res.json();
                    setIsLoggedIn(data.loggedIn);
                }
            } catch (err) {
                console.error("Error checking auth:", err);
            }
        }
        checkAuth();
    }, []);
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-100">
                <div className="container mx-auto flex h-20 items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/icon.svg" alt="ScopeLens" className="w-11 h-11" />
                        <span className="text-xl font-bold text-slate-700">ScopeLens</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8">
                        <button
                            onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
                            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            Benefits
                        </button>
                        <button
                            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            How It Works
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        {isLoggedIn ? (
                            <Link href="/dashboard">
                                <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25">
                                    Dashboard
                                </button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login">
                                    <button className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-700 transition-colors">
                                        Log In
                                    </button>
                                </Link>
                                <Link href="/signup">
                                    <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25">
                                        Get Started
                                    </button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        {/* Text Content */}
                        <div className="flex-1 text-center lg:text-left">
                            <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-slate-700 mb-6 leading-[1.1]">
                                Grow Your<br />
                                Business with<br />
                                <span className="text-blue-600">ScopeLens</span>
                            </h1>
                            <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                Partner with the leading AI detection platform. Unlock new revenue streams with competitive margins, bulk discounts, and exclusive tools designed for your success.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link href={isLoggedIn ? "/dashboard" : "/signup"}>
                                    <button className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 text-lg w-full sm:w-auto">
                                        {isLoggedIn ? "Go to Dashboard" : "Join the Reseller Program"}
                                    </button>
                                </Link>
                                <button
                                    onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="inline-flex items-center justify-center px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-all text-lg w-full sm:w-auto"
                                >
                                    Learn More
                                </button>
                            </div>
                        </div>

                        {/* Hero Image */}
                        <div className="flex-1 relative w-full max-w-2xl lg:max-w-none">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
                                <Image
                                    src="/images/reseller-hero.png"
                                    alt="ScopeLens Reseller Dashboard"
                                    width={800}
                                    height={500}
                                    className="w-full h-auto object-cover"
                                    priority
                                />
                                {/* Overlay gradient for better integration */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
                            </div>
                            {/* Decorative elements behind image */}
                            <div className="absolute -z-10 top-10 right-10 w-full h-full bg-blue-100 rounded-3xl transform rotate-3 scale-105 opacity-50"></div>
                            <div className="absolute -z-20 -bottom-10 -left-10 w-full h-full bg-indigo-50 rounded-3xl transform -rotate-2 scale-105 opacity-50"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-24 bg-slate-50/50">
                <div className="container mx-auto px-6">
                    <div className="mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-4">Why Partner with Us?</h2>
                        <p className="text-xl text-slate-500">Our reseller program is built to help you succeed with high-demand AI tools.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Benefit 1 */}
                        <div className="bg-blue-50/50 rounded-2xl p-8 border border-blue-100 hover:shadow-lg transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                                <span className="material-symbols-outlined text-3xl">trending_up</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-3">Competitive Margins</h3>
                            <p className="text-slate-500 leading-relaxed">
                                Earn significant profit on every sale with our industry-leading reseller commission rates designed to maximize your ROI.
                            </p>
                        </div>

                        {/* Benefit 2 */}
                        <div className="bg-indigo-50/50 rounded-2xl p-8 border border-indigo-100 hover:shadow-lg transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                                <span className="material-symbols-outlined text-3xl">sell</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-3">Bulk License Discounts</h3>
                            <p className="text-slate-500 leading-relaxed">
                                Access exclusive wholesale pricing tiers when purchasing licenses in volume for your educational or enterprise clients.
                            </p>
                        </div>

                        {/* Benefit 3 */}
                        <div className="bg-purple-50/50 rounded-2xl p-8 border border-purple-100 hover:shadow-lg transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                                <span className="material-symbols-outlined text-3xl">dashboard</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-3">Dedicated Dashboard</h3>
                            <p className="text-slate-500 leading-relaxed">
                                Manage all your client licenses, track usage, issue keys, and view earnings from a single, intuitive reseller portal.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-4">How it Works</h2>
                        <p className="text-xl text-slate-500">Start selling ScopeLens in three simple steps.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
                        {/* Connector Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-10"></div>

                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-slate-100 relative z-10">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                    <span className="material-symbols-outlined text-3xl">description</span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-2">1. Apply</h3>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                Fill out our simple application form to become an authorized reseller. Verification takes less than 24 hours.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-slate-100 relative z-10">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                    <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-2">2. Buy in Bulk</h3>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                Purchase license keys at discounted rates through your dedicated dashboard. The more you buy, the more you save.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-slate-100 relative z-10">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                    <span className="material-symbols-outlined text-3xl">storefront</span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-2">3. Sell to Customers</h3>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                Distribute keys to your clients and manage their subscriptions easily. Keep 100% of the markup you set.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-blue-700 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                        Ready to become a partner?
                    </h2>
                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-medium">
                        Join the ScopeLens reseller network today and start growing your business with the world&apos;s most trusted AI detection tool.
                    </p>
                    <Link href={isLoggedIn ? "/dashboard" : "/signup"}>
                        <button className="inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition-all shadow-xl text-lg transform hover:-translate-y-1">
                            {isLoggedIn ? "Go to Dashboard" : "Join the Reseller Program"}
                        </button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 py-12 border-t border-slate-200">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <img src="/icon.svg" alt="ScopeLens" className="w-8 h-8 opacity-80" />
                            <span className="text-lg font-bold text-slate-700">ScopeLens</span>
                        </div>
                        <p className="text-sm text-slate-500">© {new Date().getFullYear()} ScopeLens Inc. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
