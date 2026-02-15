"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoIsDefault, setLogoIsDefault] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    // Word Limit state
    const [wordLimit, setWordLimit] = useState<number>(5000);
    const [wordLimitSaving, setWordLimitSaving] = useState(false);
    const [wordLimitMessage, setWordLimitMessage] = useState("");
    const [wordLimitLoading, setWordLimitLoading] = useState(true);

    useEffect(() => {
        fetchLogo();
        fetchWordLimit();
    }, []);

    // ── Logo handlers ──

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

    // ── Word Limit handlers ──

    async function fetchWordLimit() {
        setWordLimitLoading(true);
        try {
            const res = await fetch("/api/admin/settings/system?key=word_limit");
            if (res.ok) {
                const data = await res.json();
                setWordLimit(parseInt(data.value) || 5000);
            }
        } catch (err) {
            console.error("Failed to fetch word limit:", err);
        } finally {
            setWordLimitLoading(false);
        }
    }

    async function handleSaveWordLimit() {
        setWordLimitSaving(true);
        setWordLimitMessage("");
        try {
            const res = await fetch("/api/admin/settings/system", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "word_limit", value: String(wordLimit) }),
            });
            const data = await res.json();
            if (res.ok) {
                setWordLimitMessage("Word limit updated successfully!");
                setTimeout(() => setWordLimitMessage(""), 3000);
            } else {
                setWordLimitMessage(data.error || "Failed to update");
            }
        } catch {
            setWordLimitMessage("Failed to update word limit");
        } finally {
            setWordLimitSaving(false);
        }
    }

    function adjustWordLimit(delta: number) {
        setWordLimit((prev) => {
            const next = prev + delta;
            if (next < 100) return 100;
            if (next > 50000) return 50000;
            return next;
        });
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
                {/* Word Limit Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="material-symbols-outlined">edit_note</span>
                            Word Limit
                        </CardTitle>
                        <CardDescription>
                            Maximum number of words allowed per uploaded document. Users will be blocked from uploading files that exceed this limit.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {wordLimitLoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                                <span className="text-sm">Loading...</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => adjustWordLimit(-500)}
                                        disabled={wordLimit <= 100 || wordLimitSaving}
                                        className="h-10 w-10 p-0 text-lg font-bold"
                                    >
                                        −
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => adjustWordLimit(-100)}
                                        disabled={wordLimit <= 100 || wordLimitSaving}
                                        className="h-10 w-10 p-0 text-sm"
                                    >
                                        -100
                                    </Button>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min={100}
                                            max={50000}
                                            value={wordLimit}
                                            onChange={(e) => {
                                                const v = parseInt(e.target.value);
                                                if (!isNaN(v)) setWordLimit(Math.max(100, Math.min(50000, v)));
                                            }}
                                            className="w-32 text-center text-lg font-semibold h-10"
                                            disabled={wordLimitSaving}
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => adjustWordLimit(100)}
                                        disabled={wordLimit >= 50000 || wordLimitSaving}
                                        className="h-10 w-10 p-0 text-sm"
                                    >
                                        +100
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => adjustWordLimit(500)}
                                        disabled={wordLimit >= 50000 || wordLimitSaving}
                                        className="h-10 w-10 p-0 text-lg font-bold"
                                    >
                                        +
                                    </Button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button onClick={handleSaveWordLimit} disabled={wordLimitSaving} size="sm">
                                        <span className="material-symbols-outlined mr-1 text-base">save</span>
                                        {wordLimitSaving ? "Saving..." : "Save"}
                                    </Button>
                                    <span className="text-xs text-muted-foreground">Range: 100 – 50,000 words</span>
                                </div>

                                {wordLimitMessage && (
                                    <p className={`text-sm font-medium ${wordLimitMessage.includes("success") ? "text-green-600" : "text-destructive"}`}>
                                        {wordLimitMessage}
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

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
            </div>
        </div>
    );
}
