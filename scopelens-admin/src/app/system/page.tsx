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
                    <div className="space-y-2 font-mono text-xs">
                        {[
                            { time: "10:45:32", level: "INFO", message: "User login successful: emily@university.edu" },
                            { time: "10:45:28", level: "INFO", message: "Scan completed: document_id=abc123, score=12%" },
                            { time: "10:45:15", level: "WARN", message: "Rate limit approaching for API key: sk-***789" },
                            { time: "10:44:58", level: "INFO", message: "New subscription: user_id=usr_456, plan=Pro" },
                            { time: "10:44:42", level: "ERROR", message: "PDF parsing failed: unsupported encoding" },
                        ].map((log, i) => (
                            <div key={i} className="flex gap-4 p-2 rounded bg-muted/50">
                                <span className="text-muted-foreground">{log.time}</span>
                                <Badge variant={
                                    log.level === "ERROR" ? "destructive" :
                                        log.level === "WARN" ? "secondary" : "outline"
                                } className="text-xs">
                                    {log.level}
                                </Badge>
                                <span className="flex-1">{log.message}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
