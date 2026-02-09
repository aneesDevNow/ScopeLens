"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Plan {
    name: string;
    slug: string;
}

interface Subscription {
    status: string;
    plans: Plan;
}

interface User {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    institution: string | null;
    avatar_url: string | null;
    created_at: string;
    subscriptions: Subscription[];
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"invite" | "edit">("invite");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        role: "user",
        institution: "",
    });

    const fetchUsers = useCallback(async (search?: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ limit: "50", offset: "0" });
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/users?${params}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchUsers]);

    const getUserName = (user: User) => {
        if (user.first_name || user.last_name) {
            return `${user.first_name || ""} ${user.last_name || ""}`.trim();
        }
        return user.email.split("@")[0];
    };

    const getUserPlan = (user: User) => {
        const activeSub = user.subscriptions?.find(s => s.status === "active");
        return activeSub?.plans?.name || "Free";
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "admin": return "default" as const;
            case "reseller": return "secondary" as const;
            default: return "outline" as const;
        }
    };

    const openInviteModal = () => {
        setModalMode("invite");
        setEditingUser(null);
        setFormData({ firstName: "", lastName: "", email: "", role: "user", institution: "" });
        setShowModal(true);
    };

    const openEditModal = (user: User) => {
        setModalMode("edit");
        setEditingUser(user);
        setFormData({
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            email: user.email,
            role: user.role || "user",
            institution: user.institution || "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (modalMode === "edit" && editingUser) {
            try {
                setSaving(true);
                const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        institution: formData.institution,
                        role: formData.role,
                    }),
                });

                if (res.ok) {
                    setShowModal(false);
                    fetchUsers(searchQuery);
                } else {
                    const err = await res.json();
                    alert(`Error: ${err.error}`);
                }
            } catch (error) {
                console.error("Failed to update user:", error);
            } finally {
                setSaving(false);
            }
        } else {
            // Invite flow — not implemented in API yet
            setShowModal(false);
        }
    };

    const handleExport = () => {
        const csv = [
            ["Name", "Email", "Role", "Plan", "Joined"].join(","),
            ...users.map(u => [
                getUserName(u),
                u.email,
                u.role,
                getUserPlan(u),
                new Date(u.created_at).toLocaleDateString()
            ].join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "users-export.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Manage platform users and permissions</p>
                </div>
                <Button onClick={openInviteModal}>
                    <span className="material-symbols-outlined mr-2">person_add</span>
                    Invite User
                </Button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">search</span>
                    <Input
                        placeholder="Search users by name or email..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <span className="material-symbols-outlined mr-2">download</span>
                    Export
                </Button>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Users ({total})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                            Loading users...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <span className="material-symbols-outlined text-4xl mb-2 block">group_off</span>
                            No users found
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-primary text-sm font-semibold">
                                                        {getUserName(user)[0]?.toUpperCase() || "?"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium">{getUserName(user)}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{getUserPlan(user)}</TableCell>
                                        <TableCell>
                                            {new Date(user.created_at).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => openEditModal(user)}>
                                                <span className="material-symbols-outlined">edit</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>{modalMode === "invite" ? "Invite New User" : "Edit User"}</CardTitle>
                            <CardDescription>
                                {modalMode === "invite" ? "Send an invitation to a new user" : "Update user details"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">First Name</label>
                                    <Input
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Last Name</label>
                                    <Input
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                    disabled={modalMode === "edit"}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <select
                                        className="w-full p-2 rounded-md border bg-background"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                        <option value="reseller">Reseller</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Institution</label>
                                    <Input
                                        value={formData.institution}
                                        onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                        placeholder="University"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleSave} className="flex-1" disabled={saving}>
                                {saving ? "Saving..." : modalMode === "invite" ? "Send Invite" : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
