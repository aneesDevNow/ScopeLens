"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Reseller {
    id: string;
    user_id: string;
    company_name: string | null;
    credit_balance: number;
    total_purchased: number;
    total_spent: number;
    commission_earned: number;
    is_active: boolean;
    created_at: string;
    profiles?: {
        full_name: string;
        email: string;
    };
    client_count?: number;
}

interface Transaction {
    id: string;
    type: string;
    amount: number;
    balance_after: number;
    description: string;
    created_at: string;
}

export default function AdminResellersPage() {
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
    const [showAddCredits, setShowAddCredits] = useState(false);
    const [showTransactions, setShowTransactions] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [creditAmount, setCreditAmount] = useState("");
    const [creditNote, setCreditNote] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchResellers();
    }, []);

    const fetchResellers = async () => {
        try {
            const res = await fetch("/api/admin/resellers");
            if (res.ok) {
                const data = await res.json();
                setResellers(data.resellers || []);
            }
        } catch (error) {
            console.error("Error fetching resellers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCredits = async () => {
        if (!selectedReseller || !creditAmount) return;
        try {
            const res = await fetch(`/api/admin/resellers/${selectedReseller.id}/credits`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseFloat(creditAmount),
                    note: creditNote,
                }),
            });
            if (res.ok) {
                await fetchResellers();
                setShowAddCredits(false);
                setCreditAmount("");
                setCreditNote("");
                setSelectedReseller(null);
            }
        } catch (error) {
            console.error("Error adding credits:", error);
        }
    };

    const fetchTransactions = async (resellerId: string) => {
        try {
            const res = await fetch(`/api/admin/resellers/${resellerId}/transactions`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    };

    const handleToggleActive = async (reseller: Reseller) => {
        try {
            const res = await fetch(`/api/admin/resellers/${reseller.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !reseller.is_active }),
            });
            if (res.ok) {
                await fetchResellers();
            }
        } catch (error) {
            console.error("Error toggling reseller:", error);
        }
    };

    const filteredResellers = resellers.filter(r =>
        r.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalCredits = resellers.reduce((sum, r) => sum + (r.credit_balance || 0), 0);
    const totalResellers = resellers.length;
    const activeResellers = resellers.filter(r => r.is_active).length;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Resellers</h1>
                    <p className="text-muted-foreground">Manage resellers and their credit balances</p>
                </div>
                <Button onClick={() => {/* TODO: Add new reseller */ }}>
                    <span className="material-symbols-outlined mr-2">person_add</span>
                    Add Reseller
                </Button>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Resellers</CardDescription>
                        <CardTitle className="text-3xl">{totalResellers}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-green-600">{activeResellers} active</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Credits Outstanding</CardDescription>
                        <CardTitle className="text-3xl">${totalCredits.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">Across all resellers</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Purchased</CardDescription>
                        <CardTitle className="text-3xl">${resellers.reduce((s, r) => s + (r.total_purchased || 0), 0).toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">All time</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Spent</CardDescription>
                        <CardTitle className="text-3xl">${resellers.reduce((s, r) => s + (r.total_spent || 0), 0).toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-xs text-muted-foreground">On client activations</span>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-sm">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">search</span>
                    <Input
                        placeholder="Search resellers..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Resellers Table */}
            <Card>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="text-left p-4 font-medium">Reseller</th>
                                <th className="text-left p-4 font-medium">Credit Balance</th>
                                <th className="text-left p-4 font-medium">Spent</th>
                                <th className="text-left p-4 font-medium">Clients</th>
                                <th className="text-left p-4 font-medium">Status</th>
                                <th className="text-right p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        Loading resellers...
                                    </td>
                                </tr>
                            ) : filteredResellers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No resellers found
                                    </td>
                                </tr>
                            ) : (
                                filteredResellers.map((reseller) => (
                                    <tr key={reseller.id} className="border-b hover:bg-muted/30">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-primary font-semibold">
                                                        {(reseller.company_name || reseller.profiles?.full_name || "R")[0]}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium">{reseller.company_name || reseller.profiles?.full_name || "Unknown"}</div>
                                                    <div className="text-sm text-muted-foreground">{reseller.profiles?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-lg font-semibold text-green-600">
                                                ${(reseller.credit_balance || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-4">${(reseller.total_spent || 0).toLocaleString()}</td>
                                        <td className="p-4">{reseller.client_count || 0}</td>
                                        <td className="p-4">
                                            <Badge variant={reseller.is_active ? "default" : "destructive"}>
                                                {reseller.is_active ? "Active" : "Blocked"}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedReseller(reseller);
                                                        setShowAddCredits(true);
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined text-sm mr-1">add</span>
                                                    Credits
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedReseller(reseller);
                                                        fetchTransactions(reseller.id);
                                                        setShowTransactions(true);
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined text-sm">history</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleToggleActive(reseller)}
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {reseller.is_active ? "block" : "check_circle"}
                                                    </span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Add Credits Modal */}
            {showAddCredits && selectedReseller && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Add Credits</CardTitle>
                            <CardDescription>
                                Add credits to {selectedReseller.company_name || selectedReseller.profiles?.full_name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-muted">
                                <p className="text-sm text-muted-foreground">Current Balance</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ${selectedReseller.credit_balance.toLocaleString()}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Credit Amount ($)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="100.00"
                                    value={creditAmount}
                                    onChange={(e) => setCreditAmount(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="note">Note (optional)</Label>
                                <Textarea
                                    id="note"
                                    placeholder="Reason for credit addition..."
                                    value={creditNote}
                                    onChange={(e) => setCreditNote(e.target.value)}
                                />
                            </div>
                            {creditAmount && (
                                <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                                    <p className="text-sm text-muted-foreground">New Balance</p>
                                    <p className="text-xl font-bold text-green-600">
                                        ${(selectedReseller.credit_balance + parseFloat(creditAmount || "0")).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => {
                                setShowAddCredits(false);
                                setSelectedReseller(null);
                                setCreditAmount("");
                                setCreditNote("");
                            }}>
                                Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleAddCredits} disabled={!creditAmount}>
                                Add ${creditAmount || "0"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {/* Transaction History Modal */}
            {showTransactions && selectedReseller && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>
                                {selectedReseller.company_name || selectedReseller.profiles?.full_name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                            {transactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.amount > 0 ? "bg-green-100" : "bg-red-100"
                                                    }`}>
                                                    <span className={`material-symbols-outlined text-sm ${tx.amount > 0 ? "text-green-600" : "text-red-600"
                                                        }`}>
                                                        {tx.amount > 0 ? "add" : "remove"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium capitalize">{tx.type.replace("_", " ")}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {tx.description || "No description"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-medium ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Balance: ${tx.balance_after.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t pt-4">
                            <Button variant="outline" className="w-full" onClick={() => {
                                setShowTransactions(false);
                                setSelectedReseller(null);
                                setTransactions([]);
                            }}>
                                Close
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
