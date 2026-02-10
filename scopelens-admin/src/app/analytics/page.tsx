"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
    totalUsers: number;
    totalScans: number;
    activeSubscriptions: number;
    newUsersToday: number;
    scansThisMonth: number;
    averageAiScore: number;
    activeResellers: number;
    monthlyRevenue: number;
    claimedKeys: number;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch("/api/admin/analytics");
            if (res.ok) {
                const json = await res.json();
                setData(json.overview || null);
            }
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalRevenue = data?.monthlyRevenue || 0;
    const mrr = data?.activeSubscriptions ? Math.round(totalRevenue / Math.max(1, 1)) : 0;
    const totalUsers = data?.totalUsers || 0;
    const activeSubscriptions = data?.activeSubscriptions || 0;
    const freeUsers = totalUsers - activeSubscriptions;
    const paidPct = totalUsers > 0 ? Math.round((activeSubscriptions / totalUsers) * 100) : 0;
    const freePct = 100 - paidPct;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Subscription Analytics</h1>
                    <p className="text-muted-foreground">Revenue and subscription metrics</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                    <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                    Loading analytics...
                </div>
            ) : (
                <>
                    {/* Revenue Stats */}
                    <div className="grid md:grid-cols-4 gap-4 mb-8">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Revenue</CardDescription>
                                <CardTitle className="text-3xl">${totalRevenue}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <span className="text-xs text-muted-foreground">This month</span>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Active Subscriptions</CardDescription>
                                <CardTitle className="text-3xl">{activeSubscriptions}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <span className="text-xs text-muted-foreground">Paid plans</span>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Scans</CardDescription>
                                <CardTitle className="text-3xl">{data?.totalScans || 0}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <span className="text-xs text-muted-foreground">{data?.scansThisMonth || 0} this month</span>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Avg. AI Score</CardDescription>
                                <CardTitle className="text-3xl">{data?.averageAiScore || 0}%</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <span className="text-xs text-muted-foreground">Detection accuracy</span>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Distribution & Breakdown */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Subscription Distribution</CardTitle>
                                <CardDescription>Users by plan type</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
                                                Paid
                                            </span>
                                            <span className="text-muted-foreground">{activeSubscriptions} users ({paidPct}%)</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full" style={{ width: `${paidPct}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-muted-foreground/30 inline-block"></span>
                                                Free
                                            </span>
                                            <span className="text-muted-foreground">{freeUsers} users ({freePct}%)</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${freePct}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Platform Summary</CardTitle>
                                <CardDescription>Key platform metrics at a glance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[
                                        { label: "Total Users", value: totalUsers, icon: "group" },
                                        { label: "New Today", value: data?.newUsersToday || 0, icon: "person_add" },
                                        { label: "Active Resellers", value: data?.activeResellers || 0, icon: "handshake" },
                                        { label: "Work Purchase Keys Claimed", value: data?.claimedKeys || 0, icon: "key" },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary">{item.icon}</span>
                                                <span className="text-sm">{item.label}</span>
                                            </div>
                                            <span className="font-bold text-lg">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Conversion Funnel */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Conversion Funnel</CardTitle>
                            <CardDescription>Free to paid conversion metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { stage: "Total Users", count: totalUsers, pct: 100 },
                                    { stage: "Active (Scanned)", count: data?.totalScans ? Math.min(totalUsers, totalUsers) : 0, pct: totalUsers > 0 ? Math.round((Math.min(data?.totalScans || 0, totalUsers) / totalUsers) * 100) : 0 },
                                    { stage: "Paid Subscribers", count: activeSubscriptions, pct: paidPct },
                                ].map((item) => (
                                    <div key={item.stage}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>{item.stage}</span>
                                            <span className="text-muted-foreground">{item.count.toLocaleString()} ({item.pct}%)</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.pct}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
