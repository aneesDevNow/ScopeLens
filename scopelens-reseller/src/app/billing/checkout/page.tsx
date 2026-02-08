"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCurrency } from "@/contexts/CurrencyContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    bonus_credits: number;
    price: number;
}

function CheckoutContent() {
    const searchParams = useSearchParams();
    const packageId = searchParams.get("package");
    const router = useRouter();
    const { formatPrice } = useCurrency();

    const [pkg, setPkg] = useState<CreditPackage | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [cardName, setCardName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");

    useEffect(() => {
        if (!packageId) {
            setLoading(false);
            return;
        }

        async function fetchPackage() {
            try {
                const res = await fetch("/api/credit-packages");
                if (res.ok) {
                    const data = await res.json();
                    const found = data.packages.find((p: CreditPackage) => p.id === packageId);
                    setPkg(found || null);
                }
            } catch (err) {
                console.error("Failed to fetch package:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchPackage();
    }, [packageId]);

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || "";
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(" ") : value;
    };

    const formatExpiry = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        if (v.length >= 2) {
            return v.substring(0, 2) + "/" + v.substring(2, 4);
        }
        return v;
    };

    async function handlePurchase(e: React.FormEvent) {
        e.preventDefault();
        if (!pkg || processing) return;

        setProcessing(true);
        setError(null);

        // Simulate network delay for "processing"
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const res = await fetch("/api/billing/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageId: pkg.id }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Purchase failed");
                setProcessing(false);
                return;
            }

            // Success! Redirect to billing with success param (or handle here)
            // Ideally we'd show a success page, but user asked for "success message" which we can do via query param or simple state
            // Let's redirect to billing
            router.push("/billing?success=true");
        } catch (err) {
            console.error("Purchase error:", err);
            setError("Network error. Please try again.");
            setProcessing(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground">Loading checkout...</p>
                </div>
            </div>
        );
    }

    if (!pkg) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 text-3xl">error</span>
                </div>
                <h1 className="text-2xl font-bold">Package Not Found</h1>
                <p className="text-muted-foreground">The package you are looking for does not exist.</p>
                <Link href="/billing">
                    <Button>Back to Billing</Button>
                </Link>
            </div>
        );
    }

    const totalCredits = pkg.credits + (pkg.bonus_credits || 0);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Link href="/billing" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <span className="material-symbols-outlined mr-2 text-lg">arrow_back</span>
                Back to Billing
            </Link>

            <h1 className="text-3xl font-bold mb-2">Checkout</h1>
            <p className="text-muted-foreground mb-8">Complete your credit purchase securely</p>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left: Payment Form */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-primary text-2xl">credit_card</span>
                            <h2 className="text-xl font-semibold">Payment Details</h2>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
                                <span className="material-symbols-outlined text-red-600">error</span>
                                <p className="text-red-800 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handlePurchase} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="cardName">Cardholder Name</Label>
                                <Input
                                    id="cardName"
                                    placeholder="John Doe"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cardNumber">Card Number</Label>
                                <div className="relative">
                                    <Input
                                        id="cardNumber"
                                        placeholder="0000 0000 0000 0000"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        maxLength={19}
                                        required
                                        className="pl-10 font-mono"
                                    />
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">credit_card</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expiry">Expiry</Label>
                                    <Input
                                        id="expiry"
                                        placeholder="MM/YY"
                                        value={expiry}
                                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                        maxLength={5}
                                        required
                                        className="font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cvc">CVC</Label>
                                    <Input
                                        id="cvc"
                                        placeholder="123"
                                        value={cvc}
                                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                        maxLength={4}
                                        required
                                        className="font-mono"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-semibold"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </div>
                                    ) : (
                                        `Pay ${formatPrice(pkg.price)}`
                                    )}
                                </Button>
                                <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
                                    <span className="material-symbols-outlined text-sm">lock</span>
                                    Payments are simulated for development
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right: Order Summary */}
                <div className="md:col-span-1">
                    <div className="bg-muted/30 border rounded-xl p-6 sticky top-8">
                        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                        <div className="bg-background rounded-lg p-4 border mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold">{pkg.name}</h3>
                                    <p className="text-sm text-muted-foreground">{pkg.credits} credits</p>
                                </div>
                                <p className="font-bold text-lg">{formatPrice(pkg.price)}</p>
                            </div>
                            {pkg.bonus_credits > 0 && (
                                <div className="mt-2 text-sm text-green-600 flex items-center gap-1 bg-green-50 p-2 rounded-md">
                                    <span className="material-symbols-outlined text-sm">add_circle</span>
                                    +{pkg.bonus_credits} bonus credits
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 text-sm border-t pt-4">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{formatPrice(pkg.price)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Tax</span>
                                <span>$0.00</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t text-foreground">
                                <span>Total</span>
                                <span>{formatPrice(pkg.price)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-primary pt-1">
                                <span>Total Credits</span>
                                <span>{totalCredits}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
