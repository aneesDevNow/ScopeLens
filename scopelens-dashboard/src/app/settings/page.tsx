"use client";

import { useEffect, useState } from "react";

interface Profile {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    institution: string | null;
    two_factor_enabled: boolean;
}

export default function SettingsPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [institution, setInstitution] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.profile);
                    setFirstName(data.profile.first_name || "");
                    setLastName(data.profile.last_name || "");
                    setInstitution(data.profile.institution || "");
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaveMessage("");
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, institution }),
            });
            setSaveMessage(res.ok ? "Profile updated successfully!" : "Failed to update profile");
        } catch {
            setSaveMessage("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                    <p className="text-gray-500">Manage your account preferences</p>
                </div>

                <div className="space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                                    <p className="text-gray-500 text-sm">Update your personal details</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            {loading ? (
                                <p className="text-gray-400">Loading...</p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">First Name</label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Last Name</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            value={profile?.email || ""}
                                            disabled
                                            className="w-full px-4 py-3 bg-gray-100 rounded-xl border border-gray-200 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Institution</label>
                                        <input
                                            type="text"
                                            value={institution}
                                            onChange={(e) => setInstitution(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 pt-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                                        >
                                            {saving ? "Saving..." : "Save Changes"}
                                        </button>
                                        {saveMessage && (
                                            <span className={`text-sm font-medium ${saveMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
                                                {saveMessage}
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                                    <p className="text-gray-500 text-sm">Manage your password and 2FA</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div>
                                    <div className="font-medium text-gray-900">Password</div>
                                    <div className="text-sm text-gray-500">Last changed 30 days ago</div>
                                </div>
                                <button className="px-5 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-white transition-colors">
                                    Change Password
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div>
                                    <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                                    <div className="text-sm text-gray-500">Add an extra layer of security</div>
                                </div>
                                <button className="px-5 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-white transition-colors">
                                    {profile?.two_factor_enabled ? "Disable 2FA" : "Enable 2FA"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Card */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                                    <p className="text-gray-500 text-sm">Choose what you want to be notified about</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div>
                                    <div className="font-medium text-gray-900">Email Notifications</div>
                                    <div className="text-sm text-gray-500">Receive scan results via email</div>
                                </div>
                                <button className="w-14 h-8 bg-blue-600 rounded-full relative cursor-pointer transition-colors">
                                    <div className="w-6 h-6 bg-white rounded-full absolute right-1 top-1 shadow transition-transform"></div>
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div>
                                    <div className="font-medium text-gray-900">Weekly Report</div>
                                    <div className="text-sm text-gray-500">Get a weekly summary of your activity</div>
                                </div>
                                <button className="w-14 h-8 bg-gray-300 rounded-full relative cursor-pointer transition-colors">
                                    <div className="w-6 h-6 bg-white rounded-full absolute left-1 top-1 shadow transition-transform"></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
