"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CoreAPIAccount {
    id: string;
    label: string;
    api_key: string;
    is_active: boolean;
    max_concurrent: number;
    total_requests: number;
    failed_requests: number;
    created_at: string;
}

interface QueueItem {
    id: string;
    scan_id: string;
    input_text: string;
    status: string;
    retry_count: number;
    result: Record<string, unknown> | null;
    error: string | null;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
}

interface QueueStats {
    waiting: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
}

export default function PlagiarismPage() {
    const [accounts, setAccounts] = useState<CoreAPIAccount[]>([]);
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [stats, setStats] = useState<QueueStats>({ waiting: 0, processing: 0, completed: 0, failed: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Add Account form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLabel, setNewLabel] = useState("");
    const [newApiKey, setNewApiKey] = useState("");
    const [newMaxConcurrent, setNewMaxConcurrent] = useState("5");
    const [addingAccount, setAddingAccount] = useState(false);

    // Edit Account
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editMaxConcurrent, setEditMaxConcurrent] = useState("");
    const [editApiKey, setEditApiKey] = useState("");

    // Auto-process
    const [autoProcess, setAutoProcess] = useState(true);
    const autoProcessRef = useRef(false);

    // Raw output viewer
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/plagiarism/accounts");
            const data = await res.json();
            setAccounts(data.accounts || []);
        } catch {
            console.error("Failed to fetch CORE API accounts");
        }
    }, []);

    const fetchQueue = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/plagiarism/queue");
            const data = await res.json();
            setQueue(data.queue || []);
            setStats(data.stats || { waiting: 0, processing: 0, completed: 0, failed: 0, total: 0 });
        } catch {
            console.error("Failed to fetch plagiarism queue");
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchAccounts(), fetchQueue()]);
            setLoading(false);
        };
        loadData();
    }, [fetchAccounts, fetchQueue]);

    useEffect(() => {
        const interval = setInterval(fetchQueue, 5000);
        return () => clearInterval(interval);
    }, [fetchQueue]);

    // Auto-process: poll every 10s if enabled and items waiting
    useEffect(() => {
        if (!autoProcess) return;

        const autoProcessInterval = setInterval(async () => {
            if (autoProcessRef.current) return;
            const res = await fetch("/api/admin/plagiarism/queue");
            const data = await res.json();
            const waitingCount = data.stats?.waiting || 0;
            if (waitingCount === 0) return;

            autoProcessRef.current = true;
            try {
                await fetch("/api/admin/plagiarism/process", { method: "POST" });
                await fetchQueue();
            } catch {
                console.error("Auto-process failed");
            } finally {
                autoProcessRef.current = false;
            }
        }, 10000);

        return () => clearInterval(autoProcessInterval);
    }, [autoProcess, fetchQueue]);

    const handleAddAccount = async () => {
        if (!newApiKey.trim()) return;
        setAddingAccount(true);
        try {
            const res = await fetch("/api/admin/plagiarism/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    label: newLabel || "CORE API Account",
                    api_key: newApiKey,
                    max_concurrent: parseInt(newMaxConcurrent) || 5,
                }),
            });
            if (res.ok) {
                setNewLabel("");
                setNewApiKey("");
                setNewMaxConcurrent("5");
                setShowAddForm(false);
                fetchAccounts();
            }
        } catch {
            console.error("Failed to add account");
        }
        setAddingAccount(false);
    };

    const handleToggleActive = async (account: CoreAPIAccount) => {
        await fetch(`/api/admin/plagiarism/accounts/${account.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: !account.is_active }),
        });
        fetchAccounts();
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm("Delete this CORE API account?")) return;
        await fetch(`/api/admin/plagiarism/accounts/${id}`, { method: "DELETE" });
        fetchAccounts();
    };

    const handleSaveEdit = async (id: string) => {
        const body: Record<string, unknown> = {
            label: editLabel,
            max_concurrent: parseInt(editMaxConcurrent) || 5,
        };
        if (editApiKey.trim()) {
            body.api_key = editApiKey;
        }
        await fetch(`/api/admin/plagiarism/accounts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        setEditingId(null);
        setEditApiKey("");
        fetchAccounts();
    };

    const handleProcessQueue = async () => {
        setProcessing(true);
        try {
            let hasMore = true;
            while (hasMore) {
                const res = await fetch("/api/admin/plagiarism/process", { method: "POST" });
                const data = await res.json();
                hasMore = (data.remaining || 0) > 0 && (data.processed || 0) > 0;
                await fetchQueue();
                if (hasMore) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } catch {
            console.error("Failed to process queue");
        }
        setProcessing(false);
    };

    const handleQueueAction = async (action: string) => {
        await fetch("/api/admin/plagiarism/queue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
        });
        fetchQueue();
    };

    const maskKey = (key: string) => {
        if (key.length <= 12) return "••••••••";
        return key.substring(0, 6) + "•••" + key.substring(key.length - 4);
    };

    const statusColor = (status: string) => {
        switch (status) {
            case "waiting": return "bg-yellow-100 text-yellow-800";
            case "processing": return "bg-blue-100 text-blue-800";
            case "completed": return "bg-green-100 text-green-800";
            case "failed": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <span className="material-symbols-outlined text-4xl animate-spin block mb-2">progress_activity</span>
                    <p className="text-muted-foreground">Loading Plagiarism Detection settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Plagiarism Detection</h1>
                    <p className="text-muted-foreground">Manage CORE API accounts and plagiarism scan queue</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAutoProcess(!autoProcess)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoProcess ? "bg-green-500" : "bg-gray-300"
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoProcess ? "translate-x-6" : "translate-x-1"
                                    }`}
                            />
                        </button>
                        <span className="text-sm text-muted-foreground">Auto</span>
                    </div>
                    <Button onClick={handleProcessQueue} disabled={processing || stats.waiting === 0}>
                        <span className="material-symbols-outlined mr-2">
                            {processing ? "progress_activity" : "play_arrow"}
                        </span>
                        {processing ? "Processing..." : `Process Queue (${stats.waiting})`}
                    </Button>
                </div>
            </div>

            {/* Queue Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            Waiting
                        </CardDescription>
                        <CardTitle className="text-3xl">{stats.waiting}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">Items in queue</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            Processing
                        </CardDescription>
                        <CardTitle className="text-3xl">{stats.processing}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">Currently scanning</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Completed
                        </CardDescription>
                        <CardTitle className="text-3xl">{stats.completed}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">Successfully scanned</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Failed
                        </CardDescription>
                        <CardTitle className="text-3xl">{stats.failed}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">
                            {stats.failed > 0 && (
                                <button onClick={() => handleQueueAction("retry_failed")} className="text-primary underline">
                                    Retry all
                                </button>
                            )}
                            {stats.failed === 0 && "No failures"}
                        </span>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Accounts Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>CORE API Accounts</CardTitle>
                                <CardDescription>Manage API keys for plagiarism detection</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                                <span className="material-symbols-outlined mr-1 text-sm">add</span>
                                Add Account
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Add Account Form */}
                        {showAddForm && (
                            <div className="bg-muted/50 p-4 rounded-lg mb-4 space-y-3">
                                <Input
                                    placeholder="Account label (e.g. Primary CORE API)"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                />
                                <Input
                                    placeholder="CORE API Key"
                                    value={newApiKey}
                                    onChange={(e) => setNewApiKey(e.target.value)}
                                    type="password"
                                />
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        placeholder="Max concurrent"
                                        value={newMaxConcurrent}
                                        onChange={(e) => setNewMaxConcurrent(e.target.value)}
                                        className="w-32"
                                    />
                                    <span className="text-xs text-muted-foreground">concurrent requests</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleAddAccount} disabled={!newApiKey.trim() || addingAccount}>
                                        {addingAccount ? "Adding..." : "Add"}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Account List */}
                        {accounts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <span className="material-symbols-outlined text-3xl mb-2 block">key_off</span>
                                <p className="text-sm">No accounts configured</p>
                                <p className="text-xs">Add a CORE API account to start processing</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {accounts.map((account) => (
                                    <div key={account.id} className="border rounded-lg p-3">
                                        {editingId === account.id ? (
                                            <div className="space-y-2">
                                                <Input
                                                    value={editLabel}
                                                    onChange={(e) => setEditLabel(e.target.value)}
                                                    placeholder="Label"
                                                />
                                                <Input
                                                    value={editApiKey}
                                                    onChange={(e) => setEditApiKey(e.target.value)}
                                                    placeholder="New API key (leave blank to keep current)"
                                                    type="password"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        value={editMaxConcurrent}
                                                        onChange={(e) => setEditMaxConcurrent(e.target.value)}
                                                        className="w-32"
                                                    />
                                                    <span className="text-xs text-muted-foreground">max concurrent</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => handleSaveEdit(account.id)}>Save</Button>
                                                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{account.label}</span>
                                                        <Badge variant={account.is_active ? "default" : "secondary"}>
                                                            {account.is_active ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(account.id);
                                                                setEditLabel(account.label);
                                                                setEditMaxConcurrent(String(account.max_concurrent));
                                                                setEditApiKey("");
                                                            }}
                                                            className="p-1 hover:bg-muted rounded"
                                                            title="Edit"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleActive(account)}
                                                            className="p-1 hover:bg-muted rounded"
                                                            title={account.is_active ? "Disable" : "Enable"}
                                                        >
                                                            <span className="material-symbols-outlined text-sm">
                                                                {account.is_active ? "toggle_on" : "toggle_off"}
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAccount(account.id)}
                                                            className="p-1 hover:bg-destructive/10 rounded text-destructive"
                                                            title="Delete"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono mb-2">
                                                    {maskKey(account.api_key)}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span>Max: {account.max_concurrent} concurrent</span>
                                                    <span>Total: {account.total_requests}</span>
                                                    <span className={account.failed_requests > 0 ? "text-destructive" : ""}>
                                                        Failed: {account.failed_requests}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Queue Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Processing Queue</CardTitle>
                                <CardDescription>Recent plagiarism scan requests</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {stats.completed > 0 && (
                                    <Button variant="outline" size="sm" onClick={() => handleQueueAction("clear_completed")}>
                                        <span className="material-symbols-outlined mr-1 text-sm">cleaning_services</span>
                                        Clear Done
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={fetchQueue}>
                                    <span className="material-symbols-outlined text-sm">refresh</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {queue.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <span className="material-symbols-outlined text-3xl mb-2 block">inbox</span>
                                <p className="text-sm">Queue is empty</p>
                                <p className="text-xs">Items appear here when plagiarism scans are uploaded</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {queue.map((item) => (
                                    <div key={item.id} className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(item.status)}`}>
                                                    {item.status}
                                                </span>
                                                {item.retry_count > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700 font-mono">
                                                        ↻{item.retry_count}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(item.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            <span className="font-mono">Scan: {item.scan_id.substring(0, 8)}...</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-full">
                                            {item.input_text.substring(0, 80)}...
                                        </div>
                                        {item.error && (
                                            <div className="text-xs text-destructive mt-1">{item.error}</div>
                                        )}
                                        {/* Raw API output toggle */}
                                        {item.result && (
                                            <div className="mt-2">
                                                <button
                                                    onClick={() => {
                                                        const next = new Set(expandedItems);
                                                        if (next.has(item.id)) next.delete(item.id);
                                                        else next.add(item.id);
                                                        setExpandedItems(next);
                                                    }}
                                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {expandedItems.has(item.id) ? "expand_less" : "expand_more"}
                                                    </span>
                                                    {expandedItems.has(item.id) ? "Hide Raw Output" : "View Raw Output"}
                                                </button>
                                                {expandedItems.has(item.id) && (
                                                    <div className="mt-2 relative">
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(
                                                                    JSON.stringify(item.result, null, 2)
                                                                );
                                                            }}
                                                            className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                                                        >
                                                            Copy
                                                        </button>
                                                        <pre className="text-xs bg-zinc-900 text-green-400 border border-zinc-700 rounded p-3 overflow-x-auto max-h-[300px] overflow-y-auto font-mono whitespace-pre-wrap">
                                                            {JSON.stringify(item.result, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
