"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const supabase = createClient();

            // Sign in with Supabase
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }

            if (!data.session) {
                setError("No session created");
                setLoading(false);
                return;
            }

            // Check if user is an admin
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", data.user.id)
                .single();

            if (profileError || !profile) {
                setError("Failed to verify admin status");
                await supabase.auth.signOut();
                setLoading(false);
                return;
            }

            const allowedRoles = ["admin", "manager"];
            if (!allowedRoles.includes(profile.role)) {
                setError("Access denied. Administrator or manager privileges required.");
                await supabase.auth.signOut();
                setLoading(false);
                return;
            }

            // Success - redirect based on role
            router.push(profile.role === "manager" ? "/licenses" : "/");
        } catch (err) {
            console.error("Login error:", err);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <img src="/icon.svg" alt="Scope Lens" className="w-12 h-12" />
                        <span className="text-2xl font-bold">Scope Lens</span>
                    </div>
                    <CardTitle className="text-xl">Admin Login</CardTitle>
                    <CardDescription>Sign in to access the admin portal</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                placeholder="admin@scopelens.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Password</label>
                                <Link href="#" className="text-xs text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button className="w-full" size="lg" type="submit" disabled={loading}>
                            <span className="material-symbols-outlined mr-2">login</span>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full" type="button">
                            <span className="material-symbols-outlined mr-2">key</span>
                            SSO Login
                        </Button>

                        <p className="text-xs text-center text-muted-foreground mt-4">
                            This area is restricted to authorized administrators only.
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
