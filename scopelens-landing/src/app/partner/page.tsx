import Link from "next/link";

export default function PartnerPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100">
                <div className="container mx-auto flex h-20 items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/icon.svg" alt="Scope Lens" className="w-11 h-11" />
                        <span className="text-xl font-bold text-gray-900">Scope Lens</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
                        <Link href="/#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
                        <Link href="/partner" className="text-sm font-medium text-blue-600">For Partners</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <button className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                                Log In
                            </button>
                        </Link>
                        <Link href="/signup">
                            <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25">
                                Get Started
                            </button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute top-20 right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
                <div className="absolute -bottom-20 left-20 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>

                <div className="container mx-auto px-6 py-24 text-center relative">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-100 rounded-full text-sm text-purple-700 font-medium mb-8">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Partner Program
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Become a Scope Lens{" "}
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Reseller
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Earn commissions by referring educational institutions and professionals to Scope Lens.
                        Join our growing network of partners and build your business.
                    </p>
                    <Link href="/signup?type=partner">
                        <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-xl shadow-purple-500/30 text-lg">
                            Apply Now
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </Link>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-purple-50 text-purple-700 text-sm font-semibold rounded-full mb-4">Benefits</span>
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Partner Benefits</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to succeed as a reseller</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Benefit 1 */}
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-1">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">30% Commission</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Earn 30% recurring commission on every subscription you refer. Monthly payouts with no caps.
                            </p>
                        </div>

                        {/* Benefit 2 */}
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-1">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Partner Dashboard</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Track referrals, earnings, and payouts in your dedicated dashboard with real-time analytics.
                            </p>
                        </div>

                        {/* Benefit 3 */}
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-1">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Dedicated Support</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Get priority support, marketing materials, and co-branded assets to help you succeed.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full mb-4">Process</span>
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                        <p className="text-xl text-gray-600">Simple steps to start earning</p>
                    </div>
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 text-center p-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                                    <span className="text-white text-2xl font-bold">1</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Apply</h3>
                                <p className="text-gray-600">Fill out the application form with your business details</p>
                            </div>
                            <div className="hidden md:block w-12 h-1 bg-gradient-to-r from-blue-200 to-purple-200"></div>
                            <div className="flex-1 text-center p-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
                                    <span className="text-white text-2xl font-bold">2</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Get Approved</h3>
                                <p className="text-gray-600">Our team reviews and approves your application</p>
                            </div>
                            <div className="hidden md:block w-12 h-1 bg-gradient-to-r from-purple-200 to-green-200"></div>
                            <div className="flex-1 text-center p-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                                    <span className="text-white text-2xl font-bold">3</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Start Earning</h3>
                                <p className="text-gray-600">Refer clients and earn commissions on every sale</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">$2M+</div>
                            <div className="text-gray-600">Paid to Partners</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">500+</div>
                            <div className="text-gray-600">Active Partners</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">30%</div>
                            <div className="text-gray-600">Commission Rate</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-2">24h</div>
                            <div className="text-gray-600">Avg Approval Time</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-gradient-to-r from-purple-600 to-blue-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-40 h-40 border border-white rounded-full"></div>
                    <div className="absolute bottom-10 right-10 w-60 h-60 border border-white rounded-full"></div>
                    <div className="absolute top-1/2 left-1/4 w-20 h-20 border border-white rounded-full"></div>
                </div>
                <div className="container mx-auto px-6 text-center relative">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Partner with Us?</h2>
                    <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
                        Join hundreds of successful partners earning with Scope Lens
                    </p>
                    <Link href="/signup?type=partner">
                        <button className="inline-flex items-center gap-2 px-10 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-xl text-lg">
                            Apply for Partner Program
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 py-16">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-3">
                            <img src="/icon.svg" alt="Scope Lens" className="w-10 h-10" />
                            <span className="text-xl font-bold text-white">Scope Lens</span>
                        </div>
                        <div className="flex gap-8 text-sm">
                            <Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
                            <Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
                            <Link href="#" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
                            <Link href="#" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
                        </div>
                        <p className="text-sm text-gray-500">© 2024 Scope Lens. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
