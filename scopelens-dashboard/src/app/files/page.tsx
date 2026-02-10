"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Scan {
    id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    ai_score: number | null;
    status: string;
    word_count: number | null;
    paragraph_count: number | null;
    created_at: string;
    completed_at: string | null;
    report_path: string | null;
}

export default function FilesPage() {
    const router = useRouter();
    const [scans, setScans] = useState<Scan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        fetchScans();
    }, []);

    const fetchScans = async () => {
        try {
            const res = await fetch("/api/scans");
            if (res.ok) {
                const data = await res.json();
                setScans(data.scans || []);
            }
        } catch (err) {
            console.error("Error fetching scans:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredScans = scans.filter(scan =>
        scan.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleNewScan = () => router.push("/");

    const handleViewDetails = (scan: Scan) => setSelectedScan(scan);

    const handleDownloadReport = async (scan: Scan) => {
        setDownloading(scan.id);
        try {
            const response = await fetch("/api/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scanId: scan.id })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to generate report");
            }
            // Download the PDF blob
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${scan.file_name?.replace(/\.[^/.]+$/, "") || "report"}_ai_report.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download error:", error);
            alert(error instanceof Error ? error.message : "Failed to download report");
        } finally {
            setDownloading(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (!bytes) return "Unknown";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric"
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-700 mb-2">File History</h1>
                        <p className="text-slate-500">Browse and manage your scanned documents</p>
                    </div>
                    <button
                        onClick={handleNewScan}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        New Scan
                    </button>
                </div>

                {/* Search */}
                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search files..."
                            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="px-5 py-3 bg-white rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filter
                    </button>
                </div>

                {/* File List */}
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-semibold text-slate-700">All Files ({filteredScans.length})</h2>
                    </div>
                    <div className="p-6">
                        {loading ? (
                            <p className="text-center text-slate-400 py-8">Loading...</p>
                        ) : filteredScans.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-slate-500">
                                    {searchQuery ? "No files match your search" : "No scans yet. Upload a document to get started!"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredScans.map((scan) => (
                                    <div
                                        key={scan.id}
                                        className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-700">{scan.file_name}</p>
                                                <p className="text-sm text-slate-400">{formatFileSize(scan.file_size)} · {formatDate(scan.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {scan.status === "completed" && scan.ai_score !== null ? (
                                                <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${scan.ai_score > 50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {scan.ai_score}% AI
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                    {scan.status}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleViewDetails(scan)}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="View details"
                                            >
                                                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDownloadReport(scan)}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Download PDF"
                                                disabled={downloading === scan.id || scan.status !== "completed"}
                                            >
                                                {downloading === scan.id ? (
                                                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Modal */}
                {selectedScan && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-slate-700">{selectedScan.file_name}</h3>
                                        <p className="text-slate-500">{formatFileSize(selectedScan.file_size)} · Scanned {formatDate(selectedScan.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                                {/* Score */}
                                <div className={`p-6 rounded-xl ${(selectedScan.ai_score || 0) > 50 ? 'bg-red-50' : 'bg-green-50'
                                    }`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`text-5xl font-bold ${(selectedScan.ai_score || 0) > 50 ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                            {selectedScan.ai_score ?? "—"}%
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-700">AI Detection Score</p>
                                            <p className="text-slate-500">
                                                {selectedScan.status !== "completed"
                                                    ? "Still processing..."
                                                    : selectedScan.ai_score !== null && selectedScan.ai_score < 20
                                                        ? "Low probability of AI content"
                                                        : selectedScan.ai_score !== null && selectedScan.ai_score < 50
                                                            ? "Moderate probability of AI content"
                                                            : "High probability of AI content"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-4">Document Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <p className="text-sm text-slate-500 mb-1">File Type</p>
                                            <p className="font-medium text-slate-700">{selectedScan.file_type || "Unknown"}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <p className="text-sm text-slate-500 mb-1">Status</p>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedScan.status === "completed" ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {selectedScan.status}
                                            </span>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <p className="text-sm text-slate-500 mb-1">Word Count</p>
                                            <p className="font-medium text-slate-700">{selectedScan.word_count ?? "N/A"}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <p className="text-sm text-slate-500 mb-1">Paragraphs</p>
                                            <p className="font-medium text-slate-700">{selectedScan.paragraph_count ?? "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 flex gap-4">
                                <button
                                    onClick={() => setSelectedScan(null)}
                                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => handleDownloadReport(selectedScan)}
                                    disabled={downloading === selectedScan.id || selectedScan.status !== "completed"}
                                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {downloading === selectedScan.id ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
