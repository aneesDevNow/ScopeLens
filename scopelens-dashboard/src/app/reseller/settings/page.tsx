"use client";

import { useState, useEffect } from "react";

interface ResellerProfile {
    id: string;
    company_name: string | null;
    credit_balance: number;
    is_active: boolean;
}

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
}

export default function ResellerSettingsPage() {
    const [profile, setProfile] = useState<ResellerProfile | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "api">("profile");

    // Form state
    const [companyName, setCompanyName] = useState("");
    const [notifications, setNotifications] = useState({
        lowBalance: true,
        clientExpiring: true,
        newTransaction: false,
        weeklyReport: true,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, userRes] = await Promise.all([
                fetch("/api/reseller/profile"),
                fetch("/api/profile"),
            ]);

            if (profileRes.ok) {
                const data = await profileRes.json();
                setProfile(data.profile);
                setCompanyName(data.profile?.company_name || "");
            }
            if (userRes.ok) {
                const data = await userRes.json();
                setUser(data.profile);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/reseller/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ company_name: companyName }),
            });
            if (res.ok) {
                await fetchData();
            }
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your reseller account preferences</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-8">
                {[
                    { id: "profile", label: "Profile", icon: "person" },
                    { id: "notifications", label: "Notifications", icon: "notifications" },
                    { id: "api", label: "API Access", icon: "code" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${activeTab === tab.id
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
                <div className="space-y-6">
                    {/* Account Info */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={user?.email || ""}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={user?.full_name || ""}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Company Information</h2>
                        <div className="max-w-md">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Enter your company name"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-1">This will be shown on invoices and reports</p>
                        </div>
                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">save</span>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>

                    {/* Reseller Status */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reseller Status</h2>
                        <div className="flex items-center gap-4">
                            <div className={`px-4 py-2 rounded-xl font-medium ${profile?.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">{profile?.is_active ? "check_circle" : "cancel"}</span>
                                    {profile?.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <p className="text-gray-500">Your reseller account is {profile?.is_active ? "active and ready to use" : "currently inactive"}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Email Notifications</h2>
                    <div className="space-y-4">
                        {[
                            { key: "lowBalance", label: "Low Balance Alert", description: "Get notified when your credit balance falls below $50" },
                            { key: "clientExpiring", label: "Client Expiring", description: "Receive alerts when client subscriptions are about to expire" },
                            { key: "newTransaction", label: "New Transaction", description: "Get notified for every credit purchase or spend" },
                            { key: "weeklyReport", label: "Weekly Report", description: "Receive a weekly summary of your reseller activity" },
                        ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-gray-900">{item.label}</p>
                                    <p className="text-sm text-gray-500">{item.description}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifications[item.key as keyof typeof notifications]}
                                        onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                    <button className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined">save</span>
                        Save Preferences
                    </button>
                </div>
            )}

            {/* API Tab */}
            {activeTab === "api" && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
                                <p className="text-sm text-gray-500">Use API keys to integrate with your systems</p>
                            </div>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all">
                                <span className="material-symbols-outlined">add</span>
                                Generate Key
                            </button>
                        </div>

                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-gray-400 text-3xl">key</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No API keys yet</h3>
                            <p className="text-gray-500">Generate an API key to start integrating</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">API Documentation</h2>
                        <p className="text-gray-500 mb-4">Learn how to integrate with our reseller API to automate client management.</p>
                        <a
                            href="#"
                            className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline"
                        >
                            <span className="material-symbols-outlined">description</span>
                            View API Documentation
                            <span className="material-symbols-outlined text-lg">open_in_new</span>
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
