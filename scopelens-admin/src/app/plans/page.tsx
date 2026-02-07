"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Plan {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    price_yearly: number;
    reseller_price_monthly: number;
    reseller_price_yearly: number;
    reseller_discount_percent: number;
    scans_per_month: number;
    features: Record<string, boolean>;
    is_active: boolean;
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        price_monthly: 0,
        price_yearly: 0,
        reseller_discount_percent: 20,
        scans_per_month: 100,
        features: "",
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch("/api/plans");
            if (res.ok) {
                const data = await res.json();
                setPlans(data.plans || []);
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingPlan(null);
        setFormData({
            name: "",
            slug: "",
            price_monthly: 0,
            price_yearly: 0,
            reseller_discount_percent: 20,
            scans_per_month: 100,
            features: "",
        });
        setShowModal(true);
    };

    const openEditModal = (plan: Plan) => {
        setEditingPlan(plan);
        const featuresArray = Object.keys(plan.features || {}).filter(k => plan.features[k]);
        setFormData({
            name: plan.name,
            slug: plan.slug,
            price_monthly: plan.price_monthly,
            price_yearly: plan.price_yearly,
            reseller_discount_percent: plan.reseller_discount_percent || 20,
            scans_per_month: plan.scans_per_month,
            features: featuresArray.join("\n"),
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        const features: Record<string, boolean> = {};
        formData.features.split("\n").filter(f => f.trim()).forEach(f => {
            features[f.trim()] = true;
        });

        const discountMultiplier = 1 - (formData.reseller_discount_percent / 100);
        const reseller_price_monthly = Math.round(formData.price_monthly * discountMultiplier * 100) / 100;
        const reseller_price_yearly = Math.round(formData.price_yearly * discountMultiplier * 100) / 100;

        const planData = {
            name: formData.name,
            slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
            price_monthly: formData.price_monthly,
            price_yearly: formData.price_yearly,
            reseller_price_monthly,
            reseller_price_yearly,
            reseller_discount_percent: formData.reseller_discount_percent,
            scans_per_month: formData.scans_per_month,
            features,
            is_active: true,
        };

        try {
            const url = editingPlan ? `/api/plans/${editingPlan.id}` : "/api/plans";
            const method = editingPlan ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(planData),
            });

            if (res.ok) {
                await fetchPlans();
                setShowModal(false);
            } else {
                const error = await res.json();
                alert(error.error || "Failed to save plan");
            }
        } catch (error) {
            console.error("Error saving plan:", error);
        }
    };

    const handleDelete = async (planId: string) => {
        if (!confirm("Are you sure you want to delete this plan?")) return;

        try {
            const res = await fetch(`/api/plans/${planId}`, { method: "DELETE" });
            if (res.ok) {
                await fetchPlans();
            }
        } catch (error) {
            console.error("Error deleting plan:", error);
        }
    };

    const calculatedResellerPrice = formData.price_monthly * (1 - formData.reseller_discount_percent / 100);
    const resellerProfit = formData.price_monthly - calculatedResellerPrice;

    if (loading) {
        return <div className="p-6"><p className="text-muted-foreground">Loading plans...</p></div>;
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Plan Management</h1>
                    <p className="text-muted-foreground">Configure subscription plans and reseller pricing</p>
                </div>
                <Button onClick={openCreateModal}>
                    <span className="material-symbols-outlined mr-2">add</span>
                    Create Plan
                </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => (
                    <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{plan.name}</CardTitle>
                                {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
                            </div>
                            <div className="text-2xl font-bold">
                                ${plan.price_monthly}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                            </div>
                            <CardDescription>{plan.scans_per_month === -1 ? "Unlimited" : plan.scans_per_month} scans/month</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Reseller Pricing Section */}
                            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                <div className="text-xs text-green-700 font-medium mb-1">Reseller Pricing</div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Cost to reseller:</span>
                                    <span className="font-bold text-green-700">${plan.reseller_price_monthly}/mo</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {plan.reseller_discount_percent}% discount ({Math.round(plan.price_monthly - plan.reseller_price_monthly)} margin)
                                </div>
                            </div>

                            {/* Features */}
                            <ul className="space-y-1 text-sm">
                                {Object.keys(plan.features || {}).filter(k => plan.features[k]).slice(0, 4).map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-sm">check</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => openEditModal(plan)}>
                                <span className="material-symbols-outlined mr-2">edit</span>
                                Edit
                            </Button>
                            {plan.name !== "Free" && (
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                                    <span className="material-symbols-outlined text-destructive">delete</span>
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</CardTitle>
                            <CardDescription>
                                {editingPlan ? "Update the plan details and reseller pricing" : "Add a new subscription plan with reseller pricing"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Plan Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Pro Plus"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Slug</Label>
                                    <Input
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        placeholder="pro-plus"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Price ($/month)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.price_monthly}
                                        onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                                        placeholder="19.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Price ($/year)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.price_yearly}
                                        onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                                        placeholder="190.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Scans per Month</Label>
                                <Input
                                    type="number"
                                    value={formData.scans_per_month}
                                    onChange={(e) => setFormData({ ...formData, scans_per_month: parseInt(e.target.value) || 0 })}
                                    placeholder="100"
                                />
                            </div>

                            {/* Reseller Pricing Section */}
                            <div className="p-4 rounded-lg border border-green-200 bg-green-50 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-600">storefront</span>
                                    <Label className="text-green-700 font-medium">Reseller Pricing</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm">Reseller Discount (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={formData.reseller_discount_percent}
                                        onChange={(e) => setFormData({ ...formData, reseller_discount_percent: parseInt(e.target.value) || 0 })}
                                        placeholder="20"
                                    />
                                </div>
                                {formData.price_monthly > 0 && (
                                    <div className="text-sm space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Retail Price:</span>
                                            <span>${formData.price_monthly.toFixed(2)}/mo</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Reseller Pays:</span>
                                            <span className="font-medium text-green-700">${calculatedResellerPrice.toFixed(2)}/mo</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-1">
                                            <span className="text-muted-foreground">Reseller Profit:</span>
                                            <span className="font-bold text-green-700">${resellerProfit.toFixed(2)}/mo</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Features (one per line)</Label>
                                <textarea
                                    className="w-full p-2 rounded-md border bg-background min-h-[100px]"
                                    value={formData.features}
                                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                    placeholder="100 scans/month&#10;Detailed reports&#10;Priority support"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleSave} className="flex-1">
                                {editingPlan ? "Save Changes" : "Create Plan"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}

