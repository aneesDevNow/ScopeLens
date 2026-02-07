"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface License {
    key: string;
    plan: string;
    users: number;
    expires: string;
    status: "Active" | "Expired";
    createdAt: Date;
}

// Generate a random license key
function generateKey(plan: string): string {
    const prefix = plan === "Enterprise" ? "ENT" : plan === "Business" ? "BUS" : "PRO";
    const year = new Date().getFullYear();
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let suffix = "";
    for (let i = 0; i < 8; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SL-${prefix}-${year}-${suffix}`;
}

// Calculate expiry date
function getExpiryDate(duration: string): string {
    const date = new Date();
    if (duration === "1 Year") date.setFullYear(date.getFullYear() + 1);
    else if (duration === "6 Months") date.setMonth(date.getMonth() + 6);
    else date.setMonth(date.getMonth() + 3);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function LicensesPage() {
    const [planType, setPlanType] = useState("Enterprise");
    const [duration, setDuration] = useState("1 Year");
    const [maxUsers, setMaxUsers] = useState(100);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [licenses, setLicenses] = useState<License[]>([
        { key: "SL-ENT-2024-A1B2C3D4", plan: "Enterprise", users: 500, expires: "Jan 15, 2025", status: "Active", createdAt: new Date("2024-01-15") },
        { key: "SL-BUS-2024-E5F6G7H8", plan: "Business", users: 50, expires: "Jul 10, 2024", status: "Active", createdAt: new Date("2024-01-10") },
        { key: "SL-PRO-2024-I9J0K1L2", plan: "Pro", users: 10, expires: "Mar 1, 2024", status: "Expired", createdAt: new Date("2023-03-01") },
    ]);

    const handleGenerate = async () => {
        setGenerating(true);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const newLicense: License = {
            key: generateKey(planType),
            plan: planType,
            users: maxUsers,
            expires: getExpiryDate(duration),
            status: "Active",
            createdAt: new Date(),
        };

        setLicenses([newLicense, ...licenses]);
        setGenerating(false);
    };

    const handleCopy = async (key: string) => {
        await navigator.clipboard.writeText(key);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleDownload = (license: License) => {
        const content = `ScopeLens License Certificate
================================
License Key: ${license.key}
Plan: ${license.plan}
Max Users: ${license.users}
Expires: ${license.expires}
Status: ${license.status}
Generated: ${license.createdAt.toLocaleDateString()}
================================
This license is valid for use with ScopeLens AI Detection Platform.
`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${license.key}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">License Key Generator</h1>
                <p className="text-muted-foreground">Generate and manage license keys</p>
            </div>

            {/* Generator */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Generate New License</CardTitle>
                    <CardDescription>Create a new license key for enterprise customers</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Plan Type</label>
                            <select
                                className="w-full p-2 rounded-md border bg-background"
                                value={planType}
                                onChange={(e) => setPlanType(e.target.value)}
                            >
                                <option>Enterprise</option>
                                <option>Business</option>
                                <option>Pro</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Duration</label>
                            <select
                                className="w-full p-2 rounded-md border bg-background"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                            >
                                <option>1 Year</option>
                                <option>6 Months</option>
                                <option>3 Months</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Max Users</label>
                            <Input
                                type="number"
                                placeholder="100"
                                value={maxUsers}
                                onChange={(e) => setMaxUsers(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                    <Button onClick={handleGenerate} disabled={generating}>
                        <span className="material-symbols-outlined mr-2">key</span>
                        {generating ? "Generating..." : "Generate License Key"}
                    </Button>
                </CardContent>
            </Card>

            {/* Recent Keys */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent License Keys</CardTitle>
                    <CardDescription>Recently generated licenses ({licenses.length} total)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {licenses.map((license, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-primary">key</span>
                                    <div>
                                        <div className="font-mono font-medium">{license.key}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {license.plan} · {license.users} users · Expires {license.expires}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={license.status === "Active" ? "outline" : "destructive"}>
                                        {license.status}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopy(license.key)}
                                        title="Copy to clipboard"
                                    >
                                        <span className="material-symbols-outlined">
                                            {copied === license.key ? "check" : "content_copy"}
                                        </span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownload(license)}
                                        title="Download license"
                                    >
                                        <span className="material-symbols-outlined">download</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
