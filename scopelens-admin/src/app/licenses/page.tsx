"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Plan {
    id: string;
    name: string;
    slug: string;
}

interface LicenseKey {
    id: string;
    key_code: string;
    status: string;
    duration_days: number;
    batch_id: string | null;
    claimed_at: string | null;
    expires_at: string | null;
    created_at: string;
    plans: { name: string; slug: string } | null;
    claimed_profile: { first_name: string; last_name: string } | null;
}

export default function LicensesPage() {
    const [keys, setKeys] = useState<LicenseKey[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("");

    // Generator form state
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [durationDays, setDurationDays] = useState(30);

    const fetchKeys = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter) params.set("status", statusFilter);

            const res = await fetch(`/api/admin/license-keys?${params}`);
            if (res.ok) {
                const data = await res.json();
                setKeys(data.keys || []);
            }
        } catch (error) {
            console.error("Failed to fetch license keys:", error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    const fetchPlans = useCallback(async () => {
        try {
            const res = await fetch("/api/plans");
            if (res.ok) {
                const data = await res.json();
                setPlans(data.plans || []);
                if (data.plans?.length > 0 && !selectedPlanId) {
                    setSelectedPlanId(data.plans[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch plans:", error);
        }
    }, [selectedPlanId]);

    useEffect(() => {
        fetchKeys();
        fetchPlans();
    }, [fetchKeys, fetchPlans]);

    const handleGenerate = async () => {
        if (!selectedPlanId) return;
        try {
            setGenerating(true);
            const res = await fetch("/api/admin/license-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan_id: selectedPlanId,
                    quantity,
                    duration_days: durationDays,
                }),
            });

            if (res.ok) {
                fetchKeys();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error("Failed to generate keys:", error);
        } finally {
            setGenerating(false);
        }
    };

    const handleRevoke = async (keyId: string) => {
        if (!confirm("Are you sure you want to revoke this key?")) return;
        try {
            const res = await fetch(`/api/admin/license-keys?id=${keyId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchKeys();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error("Failed to revoke key:", error);
        }
    };

    const handleCopy = async (key: string) => {
        await navigator.clipboard.writeText(key);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleDownload = (key: LicenseKey) => {
        const content = `ScopeLens License Certificate
================================
License Key: ${key.key_code}
Plan: ${key.plans?.name || "N/A"}
Duration: ${key.duration_days} days
Status: ${key.status}
Generated: ${new Date(key.created_at).toLocaleDateString()}
${key.claimed_at ? `Claimed: ${new Date(key.claimed_at).toLocaleDateString()}` : ""}
${key.expires_at ? `Expires: ${new Date(key.expires_at).toLocaleDateString()}` : ""}
================================
This license is valid for use with ScopeLens AI Detection Platform.
`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${key.key_code}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "available": return "outline" as const;
            case "claimed": return "default" as const;
            case "expired": return "secondary" as const;
            case "revoked": return "destructive" as const;
            default: return "outline" as const;
        }
    };

    const getClaimedByName = (key: LicenseKey) => {
        if (!key.claimed_profile) return null;
        const { first_name, last_name } = key.claimed_profile;
        return `${first_name || ""} ${last_name || ""}`.trim() || "Unknown";
    };

    // Stats
    const totalKeys = keys.length;
    const availableKeys = keys.filter(k => k.status === "available").length;
    const claimedKeys = keys.filter(k => k.status === "claimed").length;
    const revokedKeys = keys.filter(k => k.status === "revoked").length;

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">License Key Generator</h1>
                <p className="text-muted-foreground">Generate and manage license keys</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="cursor-pointer" onClick={() => setStatusFilter("")}>
                    <CardContent className="pt-4 pb-3">
                        <div className="text-xs text-muted-foreground">Total Keys</div>
                        <div className="text-2xl font-bold">{totalKeys}</div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer" onClick={() => setStatusFilter("available")}>
                    <CardContent className="pt-4 pb-3">
                        <div className="text-xs text-muted-foreground">Available</div>
                        <div className="text-2xl font-bold text-green-500">{availableKeys}</div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer" onClick={() => setStatusFilter("claimed")}>
                    <CardContent className="pt-4 pb-3">
                        <div className="text-xs text-muted-foreground">Claimed</div>
                        <div className="text-2xl font-bold text-blue-500">{claimedKeys}</div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer" onClick={() => setStatusFilter("revoked")}>
                    <CardContent className="pt-4 pb-3">
                        <div className="text-xs text-muted-foreground">Revoked</div>
                        <div className="text-2xl font-bold text-red-500">{revokedKeys}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Generator */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Generate New License Keys</CardTitle>
                    <CardDescription>Create license keys for users or resellers</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Plan</label>
                            <select
                                className="w-full p-2 rounded-md border bg-background"
                                value={selectedPlanId}
                                onChange={(e) => setSelectedPlanId(e.target.value)}
                            >
                                {plans.map((plan) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Duration (days)</label>
                            <select
                                className="w-full p-2 rounded-md border bg-background"
                                value={durationDays}
                                onChange={(e) => setDurationDays(parseInt(e.target.value))}
                            >
                                <option value={30}>30 days</option>
                                <option value={90}>90 days</option>
                                <option value={180}>180 days</option>
                                <option value={365}>1 year</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Quantity (1-100)</label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                className="w-full p-2 rounded-md border bg-background"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                            />
                        </div>
                    </div>
                    <Button onClick={handleGenerate} disabled={generating || !selectedPlanId}>
                        <span className="material-symbols-outlined mr-2">key</span>
                        {generating ? "Generating..." : `Generate ${quantity} Key${quantity > 1 ? "s" : ""}`}
                    </Button>
                </CardContent>
            </Card>

            {/* Key List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>
                                License Keys
                                {statusFilter && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                        {statusFilter}
                                        <button
                                            className="ml-1 hover:text-foreground"
                                            onClick={() => setStatusFilter("")}
                                        >×</button>
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {statusFilter
                                    ? `Showing ${keys.length} ${statusFilter} keys`
                                    : `${keys.length} total keys`}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                            Loading keys...
                        </div>
                    ) : keys.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <span className="material-symbols-outlined text-4xl mb-2 block">key_off</span>
                            No license keys found
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {keys.map((key) => (
                                <div key={key.id} className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="flex items-center gap-4">
                                        <span className="material-symbols-outlined text-primary">key</span>
                                        <div>
                                            <div className="font-mono font-medium">{key.key_code}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {key.plans?.name || "Unknown Plan"} · {key.duration_days} days
                                                {key.claimed_at && ` · Claimed ${new Date(key.claimed_at).toLocaleDateString()}`}
                                                {getClaimedByName(key) && ` by ${getClaimedByName(key)}`}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Created {new Date(key.created_at).toLocaleDateString("en-US", {
                                                    month: "short", day: "numeric", year: "numeric"
                                                })}
                                                {key.expires_at && ` · Expires ${new Date(key.expires_at).toLocaleDateString("en-US", {
                                                    month: "short", day: "numeric", year: "numeric"
                                                })}`}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={getStatusVariant(key.status)}>
                                            {key.status}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCopy(key.key_code)}
                                            title="Copy to clipboard"
                                        >
                                            <span className="material-symbols-outlined">
                                                {copied === key.key_code ? "check" : "content_copy"}
                                            </span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownload(key)}
                                            title="Download license"
                                        >
                                            <span className="material-symbols-outlined">download</span>
                                        </Button>
                                        {key.status === "available" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRevoke(key.id)}
                                                title="Revoke key"
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <span className="material-symbols-outlined">block</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
