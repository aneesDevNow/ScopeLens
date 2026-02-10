"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Subscription {
  subscription: unknown | null;
  plan: {
    name: string;
    scans_per_day: number;
  } | null;
  usage: {
    scans_used: number;
    scans_limit: number;
  };
}

interface Scan {
  id: string;
  file_name: string;
  status: string;
  ai_score: number | null;
  created_at: string;
}

export default function UploadHubPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const fetchScans = async () => {
    try {
      const scansRes = await fetch("/api/scans?limit=5");
      if (scansRes.ok) {
        const scansData = await scansRes.json();
        setScans(scansData.scans || []);
      }
    } catch (err) {
      console.error("Error fetching scans:", err);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [subRes, scansRes] = await Promise.all([
          fetch("/api/subscription"),
          fetch("/api/scans?limit=5"),
        ]);

        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscription(subData);
        }

        if (scansRes.ok) {
          const scansData = await scansRes.json();
          setScans(scansData.scans || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchScans, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (file: File) => {
    // Client-side validation
    const ext = file.name.toLowerCase().split('.').pop();
    if (!ext || !['docx', 'txt'].includes(ext)) {
      setUploadProgress("Invalid file type. Only DOCX and TXT files are allowed.");
      setTimeout(() => setUploadProgress(""), 3000);
      return;
    }
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      setUploadProgress("File too large. Maximum size is 20MB.");
      setTimeout(() => setUploadProgress(""), 3000);
      return;
    }
    // Check remaining credits client-side
    if (creditsRemaining <= 0) {
      setUploadProgress("File limit reached. Upgrade your plan to scan more.");
      setTimeout(() => setUploadProgress(""), 3000);
      return;
    }

    setUploading(true);
    setUploadProgress("Uploading...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadProgress("Processing...");
      await fetchScans();
      setUploadProgress("Complete!");
      setTimeout(() => setUploadProgress(""), 2000);

    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress(error instanceof Error ? error.message : "Upload failed");
      setTimeout(() => setUploadProgress(""), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleUpload(file);
    event.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const scansCompleted = subscription?.usage?.scans_used || 0;
  const scansLimit = subscription?.usage?.scans_limit || 5;
  const creditsRemaining = scansLimit - scansCompleted;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-700 mb-2">Upload Hub</h1>
          <p className="text-slate-500">Upload documents to scan for AI-generated content</p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 mb-8 overflow-hidden">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            className={`p-16 text-center cursor-pointer transition-all duration-300
              ${isDragging ? 'bg-blue-50 border-2 border-dashed border-blue-400' : 'hover:bg-slate-50'}
              ${uploading ? 'pointer-events-none opacity-60' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">{uploadProgress}</h3>
                <p className="text-slate-500">Please wait...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  {isDragging ? "Drop your file here" : "Drop your files here"}
                </h3>
                <p className="text-slate-500 mb-4">or click to browse from your computer</p>
                <p className="text-sm text-slate-400">Supports DOCX, TXT up to 20MB • {creditsRemaining} scan{creditsRemaining !== 1 ? 's' : ''} remaining</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Scans Completed */}
          <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 font-medium">Today</span>
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-700 mb-1">{loading ? "..." : scansCompleted}</div>
            <p className="text-slate-400 text-sm">Scans Completed</p>
          </div>

          {/* Credits Remaining */}
          <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 font-medium">Remaining</span>
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-700 mb-1">{loading ? "..." : creditsRemaining}</div>
            <p className="text-slate-400 text-sm">Credits Available</p>
          </div>

          {/* Current Plan */}
          <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 font-medium">Your Plan</span>
              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-700 mb-1">{loading ? "..." : subscription?.plan?.name || "Free"}</div>
            <p className="text-slate-400 text-sm">{scansLimit} scans/day</p>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-700">Recent Scans</h2>
            <button
              onClick={() => router.push("/files")}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="p-6">
            {loading ? (
              <p className="text-slate-400 text-center py-8">Loading...</p>
            ) : scans.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-500">No scans yet. Upload a document to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scans.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{scan.file_name}</p>
                        <p className="text-sm text-slate-400">{formatDate(scan.created_at)}</p>
                      </div>
                    </div>
                    {scan.status === "completed" ? (
                      <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${(scan.ai_score || 0) > 50
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                        }`}>
                        {scan.ai_score}% AI
                      </div>
                    ) : scan.status === "pending" || scan.status === "processing" ? (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">{scan.status}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
