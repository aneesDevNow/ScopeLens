"use client";

import { useState } from "react";
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

interface User {
    id: number;
    name: string;
    email: string;
    role: "User" | "Admin" | "Reseller";
    status: "Active" | "Suspended";
    plan: string;
    joined: string;
}

// TODO: Fetch real users from Supabase
const initialUsers: User[] = [];

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"invite" | "edit">("invite");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "User" as User["role"],
        plan: "Free",
    });

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openInviteModal = () => {
        setModalMode("invite");
        setEditingUser(null);
        setFormData({ name: "", email: "", role: "User", plan: "Free" });
        setShowModal(true);
    };

    const openEditModal = (user: User) => {
        setModalMode("edit");
        setEditingUser(user);
        setFormData({ name: user.name, email: user.email, role: user.role, plan: user.plan });
        setShowModal(true);
    };

    const handleSave = () => {
        if (modalMode === "edit" && editingUser) {
            setUsers(users.map(u =>
                u.id === editingUser.id
                    ? { ...u, name: formData.name, email: formData.email, role: formData.role, plan: formData.plan }
                    : u
            ));
        } else {
            const newUser: User = {
                id: Date.now(),
                name: formData.name,
                email: formData.email,
                role: formData.role,
                status: "Active",
                plan: formData.plan,
                joined: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            };
            setUsers([newUser, ...users]);
        }
        setShowModal(false);
    };

    const toggleUserStatus = (userId: number) => {
        setUsers(users.map(u =>
            u.id === userId
                ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" }
                : u
        ));
    };

    const handleExport = () => {
        const csv = [
            ["Name", "Email", "Role", "Status", "Plan", "Joined"].join(","),
            ...users.map(u => [u.name, u.email, u.role, u.status, u.plan, u.joined].join(","))
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
                        placeholder="Search users..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline">
                    <span className="material-symbols-outlined mr-2">filter_list</span>
                    Filter
                </Button>
                <Button variant="outline" onClick={handleExport}>
                    <span className="material-symbols-outlined mr-2">download</span>
                    Export
                </Button>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Users ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-primary text-sm font-semibold">{user.name[0]}</span>
                                            </div>
                                            <div>
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === "Active" ? "outline" : "destructive"}>
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.plan}</TableCell>
                                    <TableCell>{user.joined}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => openEditModal(user)}>
                                            <span className="material-symbols-outlined">edit</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleUserStatus(user.id)}
                                            title={user.status === "Active" ? "Block user" : "Unblock user"}
                                        >
                                            <span className="material-symbols-outlined">
                                                {user.status === "Active" ? "block" : "check_circle"}
                                            </span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal */}
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <select
                                        className="w-full p-2 rounded-md border bg-background"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as User["role"] })}
                                    >
                                        <option>User</option>
                                        <option>Admin</option>
                                        <option>Reseller</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Plan</label>
                                    <select
                                        className="w-full p-2 rounded-md border bg-background"
                                        value={formData.plan}
                                        onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                    >
                                        <option>Free</option>
                                        <option>Pro</option>
                                        <option>Business</option>
                                        <option>Enterprise</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleSave} className="flex-1">
                                {modalMode === "invite" ? "Send Invite" : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
