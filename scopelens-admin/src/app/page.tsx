"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    monthlyRevenue: 0,
    scansThisMonth: 0,
    activeResellers: 0,
    claimedKeys: 0
  });

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementSent, setAnnouncementSent] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        if (data.overview) {
          setStats(data.overview);
        }
      }
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    } finally {
      setLoading(false);
    }
  };

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
Total Users: ${stats.totalUsers}
Monthly Revenue: $${stats.monthlyRevenue}
Scans This Month: ${stats.scansThisMonth}
Active Resellers: ${stats.activeResellers}
Keys Claimed: ${stats.claimedKeys}

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
            <CardTitle className="text-3xl">{loading ? "-" : stats.totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">Registered accounts</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              Monthly Revenue
            </CardDescription>
            <CardTitle className="text-3xl">{loading ? "-" : `$${stats.monthlyRevenue}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">Credits purchased this month</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Scans This Month
            </CardDescription>
            <CardTitle className="text-3xl">{loading ? "-" : stats.scansThisMonth}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">Documents processed</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">handshake</span>
              Active Resellers
            </CardDescription>
            <CardTitle className="text-3xl">{loading ? "-" : stats.activeResellers}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">Partners with accounts</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>System highlights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-500">key</span>
                  <div>
                    <p className="font-medium text-sm">License Keys Claimed</p>
                    <p className="text-xs text-muted-foreground">Total keys activated by users</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{loading ? "-" : stats.claimedKeys}</span>
              </div>
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
