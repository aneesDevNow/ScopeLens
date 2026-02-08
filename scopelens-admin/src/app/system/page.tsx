import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SystemPage() {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">System Health & Logs</h1>
                    <p className="text-muted-foreground">Monitor system performance and view logs</p>
                </div>
                <Button variant="outline">
                    <span className="material-symbols-outlined mr-2">refresh</span>
                    Refresh
                </Button>
            </div>

            {/* System Status */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            API Server
                        </CardDescription>
                        <CardTitle className="text-lg">Operational</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">99.99% uptime</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Database
                        </CardDescription>
                        <CardTitle className="text-lg">Healthy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">24ms latency</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            AI Models
                        </CardDescription>
                        <CardTitle className="text-lg">Running</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">Avg 1.2s inference</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            Storage
                        </CardDescription>
                        <CardTitle className="text-lg">78% Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">780GB / 1TB</span>
                    </CardContent>
                </Card>
            </div>

            {/* Metrics */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>CPU & Memory Usage</CardTitle>
                        <CardDescription>Real-time resource utilization</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>CPU Usage</span>
                                    <span>42%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: "42%" }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Memory Usage</span>
                                    <span>68%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-secondary rounded-full" style={{ width: "68%" }}></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Request Volume</CardTitle>
                        <CardDescription>API requests per minute</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-muted-foreground">Request Chart</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Logs */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Logs</CardTitle>
                    <CardDescription>Real-time system events</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <span className="material-symbols-outlined text-3xl mb-2 block">description</span>
                        <p className="text-sm">No logs yet</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
