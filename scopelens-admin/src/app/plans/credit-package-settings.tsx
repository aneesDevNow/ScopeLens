"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    bonus_credits: number;
    price: number;
    is_popular: boolean;
    is_active: boolean;
    sort_order: number;
}

export function CreditPackageSettings() {
    const [packages, setPackages] = useState<CreditPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<CreditPackage>>({});
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchPackages();
    }, []);

    async function fetchPackages() {
        try {
            const res = await fetch("/api/admin/settings/credit-packages");
            if (res.ok) {
                const data = await res.json();
                setPackages(data.packages);
            }
        } catch (err) {
            console.error("Failed to fetch packages:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(id?: string) {
        try {
            const method = id ? "PUT" : "POST";
            const body = id ? { ...editForm, id } : editForm;

            const res = await fetch("/api/admin/settings/credit-packages", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                await fetchPackages();
                setEditingId(null);
                setIsCreating(false);
                setEditForm({});
            }
        } catch (err) {
            console.error("Failed to save package:", err);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this package?")) return;
        try {
            const res = await fetch(`/api/admin/settings/credit-packages?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchPackages();
            }
        } catch (err) {
            console.error("Failed to delete package:", err);
        }
    }

    function startEdit(pkg: CreditPackage) {
        setEditingId(pkg.id);
        setEditForm(pkg);
        setIsCreating(false);
    }

    function startCreate() {
        setIsCreating(true);
        setEditingId(null);
        setEditForm({
            name: "",
            credits: 0,
            bonus_credits: 0,
            price: 0,
            is_popular: false,
            is_active: true,
            sort_order: packages.length + 1
        });
    }

    function cancelEdit() {
        setEditingId(null);
        setIsCreating(false);
        setEditForm({});
    }

    if (loading) return <div>Loading...</div>;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                            Credit Packages
                        </CardTitle>
                        <CardDescription>Manage available credit packages for resellers</CardDescription>
                    </div>
                    <Button onClick={startCreate} disabled={isCreating || editingId !== null}>
                        <span className="material-symbols-outlined mr-2">add</span>
                        Add Package
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sort</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Credits</TableHead>
                                <TableHead>Bonus</TableHead>
                                <TableHead>Price ($)</TableHead>
                                <TableHead>Flags</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isCreating && (
                                <TableRow className="bg-muted/50">
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={editForm.sort_order}
                                            onChange={e => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) })}
                                            className="w-16 h-8"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            placeholder="Name"
                                            className="h-8"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={editForm.credits}
                                            onChange={e => setEditForm({ ...editForm, credits: parseInt(e.target.value) })}
                                            className="w-20 h-8"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={editForm.bonus_credits}
                                            onChange={e => setEditForm({ ...editForm, bonus_credits: parseInt(e.target.value) })}
                                            className="w-20 h-8"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={editForm.price}
                                            onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                            className="w-24 h-8"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs flex items-center gap-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.is_popular}
                                                    onChange={e => setEditForm({ ...editForm, is_popular: e.target.checked })}
                                                />
                                                Popular
                                            </label>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editForm.is_active}
                                                onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm">Active</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" onClick={() => handleSave()}>Save</Button>
                                            <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}

                            {packages.map(pkg => (
                                <TableRow key={pkg.id}>
                                    <TableCell>{editingId === pkg.id ? (
                                        <Input
                                            type="number"
                                            value={editForm.sort_order}
                                            onChange={e => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) })}
                                            className="w-16 h-8"
                                        />
                                    ) : pkg.sort_order}</TableCell>
                                    <TableCell>{editingId === pkg.id ? (
                                        <Input
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            className="h-8"
                                        />
                                    ) : pkg.name}</TableCell>
                                    <TableCell>{editingId === pkg.id ? (
                                        <Input
                                            type="number"
                                            value={editForm.credits}
                                            onChange={e => setEditForm({ ...editForm, credits: parseInt(e.target.value) })}
                                            className="w-20 h-8"
                                        />
                                    ) : pkg.credits}</TableCell>
                                    <TableCell>{editingId === pkg.id ? (
                                        <Input
                                            type="number"
                                            value={editForm.bonus_credits}
                                            onChange={e => setEditForm({ ...editForm, bonus_credits: parseInt(e.target.value) })}
                                            className="w-20 h-8"
                                        />
                                    ) : (pkg.bonus_credits > 0 ? <span className="text-green-600">+{pkg.bonus_credits}</span> : "-")}</TableCell>
                                    <TableCell>{editingId === pkg.id ? (
                                        <Input
                                            type="number"
                                            value={editForm.price}
                                            onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                            className="w-24 h-8"
                                        />
                                    ) : `$${pkg.price}`}</TableCell>
                                    <TableCell>{editingId === pkg.id ? (
                                        <label className="text-xs flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editForm.is_popular}
                                                onChange={e => setEditForm({ ...editForm, is_popular: e.target.checked })}
                                            />
                                            Popular
                                        </label>
                                    ) : (pkg.is_popular && <Badge variant="secondary">Popular</Badge>)}</TableCell>
                                    <TableCell>{editingId === pkg.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editForm.is_active}
                                                onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm">Active</span>
                                        </div>
                                    ) : (
                                        <Badge variant={pkg.is_active ? "default" : "outline"}>
                                            {pkg.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    )}</TableCell>
                                    <TableCell className="text-right">
                                        {editingId === pkg.id ? (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" onClick={() => handleSave(pkg.id)}>Save</Button>
                                                <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => startEdit(pkg)}>
                                                    <span className="material-symbols-outlined text-base">edit</span>
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(pkg.id)}>
                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
