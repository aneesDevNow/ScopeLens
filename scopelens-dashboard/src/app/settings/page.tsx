"use client";

import { useEffect, useState } from "react";

interface Profile {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;

    two_factor_enabled: boolean;
    email_notifications?: boolean;
    weekly_report?: boolean;
}

export default function SettingsPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    // Change Password modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState(false);

    // 2FA state
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);

    // Notification states
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [weeklyReport, setWeeklyReport] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.profile);
                    setFirstName(data.profile.first_name || "");
                    setLastName(data.profile.last_name || "");

                    setTwoFactorEnabled(data.profile.two_factor_enabled || false);

                    // Load notification preferences from profile or localStorage fallback
                    if (data.profile.email_notifications !== undefined) {
                        setEmailNotifications(data.profile.email_notifications);
                    } else {
                        const stored = localStorage.getItem("scopelens_email_notifications");
                        setEmailNotifications(stored !== null ? stored === "true" : true);
                    }
                    if (data.profile.weekly_report !== undefined) {
                        setWeeklyReport(data.profile.weekly_report);
                    } else {
                        const stored = localStorage.getItem("scopelens_weekly_report");
                        setWeeklyReport(stored !== null ? stored === "true" : false);
                    }
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
                body: JSON.stringify({ firstName, lastName }),
            });
            setSaveMessage(res.ok ? "Profile updated successfully!" : "Failed to update profile");
        } catch {
            setSaveMessage("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordMessage("");
        setPasswordError(false);

        if (newPassword !== confirmNewPassword) {
            setPasswordMessage("New passwords do not match");
            setPasswordError(true);
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMessage("Password must be at least 6 characters");
            setPasswordError(true);
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await fetch("/api/profile/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setPasswordMessage("Password changed successfully!");
                setPasswordError(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmNewPassword("");
                setTimeout(() => setShowPasswordModal(false), 2000);
            } else {
                setPasswordMessage(data.error || "Failed to change password");
                setPasswordError(true);
            }
        } catch {
            setPasswordMessage("An error occurred");
            setPasswordError(true);
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleToggle2FA = async () => {
        setTwoFactorLoading(true);
        const newValue = !twoFactorEnabled;
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ two_factor_enabled: newValue }),
            });
            if (res.ok) {
                setTwoFactorEnabled(newValue);
            }
        } catch (err) {
            console.error("Error toggling 2FA:", err);
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const handleToggleEmailNotifications = async () => {
        const newValue = !emailNotifications;
        setEmailNotifications(newValue);
        localStorage.setItem("scopelens_email_notifications", String(newValue));
        // Try to persist to DB (may fail if column doesn't exist yet)
        try {
            await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email_notifications: newValue }),
            });
        } catch {
            // Silently ignore — localStorage is the fallback
        }
    };

    const handleToggleWeeklyReport = async () => {
        const newValue = !weeklyReport;
        setWeeklyReport(newValue);
        localStorage.setItem("scopelens_weekly_report", String(newValue));
        // Try to persist to DB
        try {
            await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weekly_report: newValue }),
            });
        } catch {
            // Silently ignore — localStorage is the fallback
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-700 mb-2">Settings</h1>
                    <p className="text-slate-500">Manage your account preferences</p>
                </div>

                <div className="space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-700">Profile Information</h2>
                                    <p className="text-slate-500 text-sm">Update your personal details</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            {loading ? (
                                <p className="text-slate-400">Loading...</p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-600">First Name</label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-600">Last Name</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-600">Email</label>
                                        <input
                                            type="email"
                                            value={profile?.email || ""}
                                            disabled
                                            className="w-full px-4 py-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-500 cursor-not-allowed"
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
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-700">Security</h2>
                                    <p className="text-slate-500 text-sm">Manage your password and 2FA</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Password */}
                            <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div>
                                    <div className="font-medium text-slate-700">Password</div>
                                    <div className="text-sm text-slate-500">Change your account password</div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(true);
                                        setPasswordMessage("");
                                        setCurrentPassword("");
                                        setNewPassword("");
                                        setConfirmNewPassword("");
                                    }}
                                    className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white hover:border-slate-300 transition-colors"
                                >
                                    Change Password
                                </button>
                            </div>

                            {/* 2FA */}
                            <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div>
                                    <div className="font-medium text-slate-700">Two-Factor Authentication</div>
                                    <div className="text-sm text-slate-500">
                                        {twoFactorEnabled ? "2FA is currently enabled" : "Add an extra layer of security"}
                                    </div>
                                </div>
                                <button
                                    onClick={handleToggle2FA}
                                    disabled={twoFactorLoading}
                                    className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors duration-300 ${twoFactorEnabled ? "bg-green-500" : "bg-slate-300"
                                        } ${twoFactorLoading ? "opacity-50" : ""}`}
                                >
                                    <div
                                        className={`w-6 h-6 bg-white rounded-full absolute top-1 shadow-md transition-transform duration-300 ${twoFactorEnabled ? "translate-x-7" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Card */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-700">Notifications</h2>
                                    <p className="text-slate-500 text-sm">Choose what you want to be notified about</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Email Notifications */}
                            <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div>
                                    <div className="font-medium text-slate-700">Email Notifications</div>
                                    <div className="text-sm text-slate-500">Receive scan results via email</div>
                                </div>
                                <button
                                    onClick={handleToggleEmailNotifications}
                                    className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors duration-300 ${emailNotifications ? "bg-blue-600" : "bg-slate-300"
                                        }`}
                                >
                                    <div
                                        className={`w-6 h-6 bg-white rounded-full absolute top-1 shadow-md transition-transform duration-300 ${emailNotifications ? "translate-x-7" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Weekly Report */}
                            <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div>
                                    <div className="font-medium text-slate-700">Weekly Report</div>
                                    <div className="text-sm text-slate-500">Get a weekly summary of your activity</div>
                                </div>
                                <button
                                    onClick={handleToggleWeeklyReport}
                                    className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors duration-300 ${weeklyReport ? "bg-blue-600" : "bg-slate-300"
                                        }`}
                                >
                                    <div
                                        className={`w-6 h-6 bg-white rounded-full absolute top-1 shadow-md transition-transform duration-300 ${weeklyReport ? "translate-x-7" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-700">Change Password</h3>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-500 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-600">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-600">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-600">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {passwordMessage && (
                                <div className={`p-3 rounded-xl text-sm font-medium ${passwordError
                                    ? "bg-red-50 text-red-600 border border-red-100"
                                    : "bg-green-50 text-green-600 border border-green-100"
                                    }`}>
                                    {passwordMessage}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={passwordLoading}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                            >
                                {passwordLoading ? "Changing..." : "Change Password"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
