"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminOverviewPage() {
  const router = useRouter();
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementSent, setAnnouncementSent] = useState(false);

  const handleAddUser = () => {
    router.push("/users");
  };

  const handleGenerateLicense = () => {
    router.push("/licenses");
  };

  const handleSendAnnouncement = async () => {
    if (!announcementText.trim()) return;

    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 500));
    setAnnouncementSent(true);
    setTimeout(() => {
      setShowAnnouncementModal(false);
      setAnnouncementSent(false);
      setAnnouncementText("");
    }, 1500);
  };

  const handleExportReport = () => {
    const report = `ScopeLens Platform Report
==========================
Generated: ${new Date().toLocaleString()}

Platform Metrics
----------------
Total Users: 12,450
Monthly Revenue: $45,230
Scans This Month: 847,000
Active Resellers: 156

User Growth: +12% this month
Revenue Growth: +8% vs last month

Recent Activity
---------------
- 3 new signups in the last hour
- 156 active resellers
- 847K scans processed

This report was auto-generated from the ScopeLens Admin Dashboard.
`;
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scopelens-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">Platform metrics and quick actions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              Total Users
            </CardDescription>
            <CardTitle className="text-3xl">12,450</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-green-500">+12% this month</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              Monthly Revenue
            </CardDescription>
            <CardTitle className="text-3xl">$45,230</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-green-500">+8% vs last month</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Scans This Month
            </CardDescription>
            <CardTitle className="text-3xl">847K</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">Avg 28.2K/day</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">handshake</span>
              Active Resellers
            </CardDescription>
            <CardTitle className="text-3xl">156</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-green-500">+5 this week</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Emily Chen", email: "emily@university.edu", time: "5 min ago" },
                { name: "Marcus Johnson", email: "mjohnson@college.edu", time: "12 min ago" },
                { name: "Sarah Williams", email: "swilliams@school.edu", time: "1 hour ago" },
              ].map((user, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-sm font-semibold">{user.name[0]}</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{user.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col" onClick={handleAddUser}>
                <span className="material-symbols-outlined mb-2">person_add</span>
                Add User
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" onClick={handleGenerateLicense}>
                <span className="material-symbols-outlined mb-2">key</span>
                Generate License
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setShowAnnouncementModal(true)}>
                <span className="material-symbols-outlined mb-2">campaign</span>
                Send Announcement
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" onClick={handleExportReport}>
                <span className="material-symbols-outlined mb-2">download</span>
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Send Announcement</CardTitle>
              <CardDescription>Send a message to all platform users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  className="w-full p-3 rounded-md border bg-background min-h-[120px]"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Enter your announcement message..."
                />
              </div>
              {announcementSent && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <span className="material-symbols-outlined">check_circle</span>
                  Announcement sent successfully!
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAnnouncementModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSendAnnouncement} className="flex-1" disabled={!announcementText.trim() || announcementSent}>
                <span className="material-symbols-outlined mr-2">send</span>
                Send
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
