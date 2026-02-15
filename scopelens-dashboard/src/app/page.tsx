"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PricingSection from "@/components/PricingSection";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  credits: number;
  features: Record<string, boolean>;
  is_active: boolean;
}

export default function LandingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlanSlug, setCurrentPlanSlug] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [plansRes, authRes] = await Promise.all([
          fetch("/api/plans"),
          fetch("/api/auth/check"),
        ]);
        if (plansRes.ok) {
          const data = await plansRes.json();
          setPlans(data.plans || []);
        }
        if (authRes.ok) {
          const auth = await authRes.json();
          setIsLoggedIn(auth.loggedIn);
          setCurrentPlanSlug(auth.currentPlan || null);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }
    init();
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
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Pricing
            </button>
            <a
              href={`${process.env.NEXT_PUBLIC_RESELLER_URL || 'http://localhost:3003'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Become a Reseller
            </a>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/scan">
                <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25">
                  Scan Files Now
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
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>

        <div className="container mx-auto px-6 py-24 lg:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-sm text-blue-700 font-medium mb-8">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              99.2% Detection Accuracy
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-700 mb-8">
              Unmask AI with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Precision
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Advanced AI content detection platform built for academic integrity.
              Analyze documents with industry-leading accuracy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={isLoggedIn ? "/scan" : "/signup"}>
                <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl shadow-blue-500/30 text-lg">
                  {isLoggedIn ? "Scan Files Now" : "Start Scanning for Free"}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-600 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-lg"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Enterprise-grade security</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Results in seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Trusted by 10,000+ educators</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full mb-4">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-700 mb-6">Why Choose ScopeLens?</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Industry-leading detection powered by advanced algorithms
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-3">99.2% Accuracy</h3>
              <p className="text-slate-500 leading-relaxed">
                Our AI models are trained on millions of samples for unmatched detection accuracy across all content types.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-3">Instant Results</h3>
              <p className="text-slate-500 leading-relaxed">
                Get comprehensive analysis results in seconds, not minutes. Our optimized engine processes documents instantly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-3">Detailed Reports</h3>
              <p className="text-slate-500 leading-relaxed">
                Get paragraph-by-paragraph breakdown with confidence scores, highlights, and exportable PDF reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Pricing Section */}
      {plans.length > 0 && <PricingSection plans={plans} isLoggedIn={isLoggedIn} currentPlanSlug={currentPlanSlug} />}

      {/* Become a Reseller Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8 p-8 md:p-10">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-slate-700 mb-2">Become a Reseller</h3>
                <p className="text-slate-500 leading-relaxed">
                  Earn commissions by selling ScopeLens work purchase keys to educational institutions, teachers, and students.
                  Get your own dashboard, generate keys, and track your revenue.
                </p>
              </div>
              <div className="flex-shrink-0">
                <a href={`${process.env.NEXT_PUBLIC_RESELLER_URL || 'http://localhost:3003'}`} target="_blank" rel="noopener noreferrer">
                  <button className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 whitespace-nowrap">
                    Join as Reseller
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border border-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 border border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-20 h-20 border border-white rounded-full"></div>
        </div>
        <div className="container mx-auto px-6 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of educators using ScopeLens to maintain academic integrity
          </p>
          <Link href={isLoggedIn ? "/scan" : "/signup"}>
            <button className="inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-xl text-lg">
              {isLoggedIn ? "Scan Files Now" : "Start Your Free Trial"}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/icon.svg" alt="ScopeLens" className="w-10 h-10" />
              <span className="text-xl font-bold text-slate-700">ScopeLens</span>
            </div>
            <div className="flex gap-8 text-sm">
              <Link href="#" className="text-slate-500 hover:text-slate-700 transition-colors">Privacy</Link>
              <Link href="#" className="text-slate-500 hover:text-slate-700 transition-colors">Terms</Link>
              <Link href="#" className="text-slate-500 hover:text-slate-700 transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-slate-400">© {new Date().getFullYear()} ScopeLens. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
