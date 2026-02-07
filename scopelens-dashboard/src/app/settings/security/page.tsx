"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SecuritySettingsPage() {
    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Security Settings</h1>
                <p className="text-muted-foreground">Manage your account security</p>
            </div>

            <div className="space-y-6 max-w-2xl">
                {/* Change Password */}
                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current Password</label>
                            <Input type="password" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <Input type="password" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm New Password</label>
                            <Input type="password" placeholder="••••••••" />
                        </div>
                        <Button>Update Password</Button>
                    </CardContent>
                </Card>

                {/* Two-Factor Authentication */}
                <Card>
                    <CardHeader>
                        <CardTitle>Two-Factor Authentication</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4 block">security</span>
                            <h3 className="text-lg font-semibold mb-2">2FA Not Enabled</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                                Add an extra layer of security to your account by enabling two-factor authentication.
                            </p>
                            <Button>
                                <span className="material-symbols-outlined mr-2">lock</span>
                                Enable 2FA
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Sessions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Active Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-muted-foreground">computer</span>
                                    <div>
                                        <div className="font-medium">MacBook Pro - Chrome</div>
                                        <div className="text-sm text-muted-foreground">Current session · San Francisco, CA</div>
                                    </div>
                                </div>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active Now</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-muted-foreground">phone_iphone</span>
                                    <div>
                                        <div className="font-medium">iPhone 14 - Safari</div>
                                        <div className="text-sm text-muted-foreground">Last active 2 hours ago</div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-destructive">Revoke</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
