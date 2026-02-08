import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Subscription Analytics</h1>
                    <p className="text-muted-foreground">Revenue and subscription metrics</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Last 7 Days</Button>
                    <Button variant="outline">Last 30 Days</Button>
                    <Button>Last 90 Days</Button>
                </div>
            </div>

            {/* Revenue Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Revenue</CardDescription>
                        <CardTitle className="text-3xl">$0</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">No data yet</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>MRR</CardDescription>
                        <CardTitle className="text-3xl">$0</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">No data yet</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Churn Rate</CardDescription>
                        <CardTitle className="text-3xl">0%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">No data yet</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Avg. LTV</CardDescription>
                        <CardTitle className="text-3xl">$0</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">No data yet</span>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Placeholder */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Over Time</CardTitle>
                        <CardDescription>Monthly recurring revenue trend</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-muted-foreground">Revenue Chart</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Distribution</CardTitle>
                        <CardDescription>Users by plan type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-muted-foreground">Pie Chart</span>
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
                            { stage: "Visitors", count: 0, pct: 0 },
                            { stage: "Signups", count: 0, pct: 0 },
                            { stage: "Active Users", count: 0, pct: 0 },
                            { stage: "Paid Subscribers", count: 0, pct: 0 },
                        ].map((item) => (
                            <div key={item.stage}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{item.stage}</span>
                                    <span className="text-muted-foreground">{item.count.toLocaleString()} ({item.pct}%)</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.pct}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
