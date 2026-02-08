"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditPackageSettings } from "./credit-package-settings";

export default function SettingsPage() {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoIsDefault, setLogoIsDefault] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchLogo();
    }, []);

    async function fetchLogo() {
        try {
            const res = await fetch("/api/admin/settings/logo");
            if (res.ok) {
                const data = await res.json();
                setLogoUrl(data.logoUrl);
                setLogoIsDefault(data.isDefault);
            }
        } catch (err) {
            console.error("Failed to fetch logo:", err);
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setMessage("");
        try {
            const formData = new FormData();
            formData.append("logo", file);
            const res = await fetch("/api/admin/settings/logo", { method: "POST", body: formData });
            const data = await res.json();
            if (res.ok) {
                setLogoUrl(data.logoUrl);
                setLogoIsDefault(data.isDefault);
                setMessage("Logo updated successfully!");
            } else {
                setMessage(data.error || "Upload failed");
            }
        } catch {
            setMessage("Upload failed");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    async function handleReset() {
        setUploading(true);
        setMessage("");
        try {
            const res = await fetch("/api/admin/settings/logo", { method: "DELETE" });
            if (res.ok) {
                setLogoUrl(null);
                setLogoIsDefault(true);
                setMessage("Logo reset to default");
            }
        } catch {
            setMessage("Reset failed");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Settings</h1>
                    <p className="text-muted-foreground">Manage site-wide configuration</p>
                </div>
            </div>

            <div className="grid gap-6 max-w-2xl">
                {/* Report Logo Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="material-symbols-outlined">image</span>
                            Report Logo
                        </CardTitle>
                        <CardDescription>
                            This logo appears in all PDF reports generated across the platform. Defaults to ScopeLens logo if not set.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-6">
                            {/* Logo Preview */}
                            <div className="w-28 h-28 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Site logo" className="max-w-full max-h-full object-contain p-2" />
                                ) : (
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-3xl text-primary mb-1 block">lens</span>
                                        <span className="text-xs text-muted-foreground">Default</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label>
                                        <Button variant="default" disabled={uploading} asChild className="cursor-pointer">
                                            <span>
                                                <span className="material-symbols-outlined mr-2 text-base">upload</span>
                                                {uploading ? "Uploading..." : "Upload Logo"}
                                            </span>
                                        </Button>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                            onChange={handleUpload}
                                            disabled={uploading}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {!logoIsDefault && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleReset}
                                        disabled={uploading}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <span className="material-symbols-outlined mr-1 text-base">restart_alt</span>
                                        Reset to default
                                    </Button>
                                )}

                                <p className="text-xs text-muted-foreground">PNG, JPG, SVG, or WebP. Max 500KB. Recommended: 200×60px</p>

                                {message && (
                                    <p className={`text-sm font-medium ${message.includes("success") || message.includes("reset") ? "text-green-600" : "text-destructive"}`}>
                                        {message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Credit Packages */}
                <CreditPackageSettings />
            </div>
        </div>
    );
}
