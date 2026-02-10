"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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

function ReportsPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const scanId = searchParams.get("scanId");

    const [scan, setScan] = useState<Scan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        async function fetchReport() {
            try {
                if (scanId) {
                    // Fetch specific scan
                    const res = await fetch(`/api/scans/${scanId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setScan(data.scan);
                    } else {
                        setError("Report not found");
                    }
                } else {
                    // Fetch most recent completed scan
                    const res = await fetch("/api/scans?limit=1");
                    if (res.ok) {
                        const data = await res.json();
                        if (data.scans && data.scans.length > 0) {
                            setScan(data.scans[0]);
                        } else {
                            setError("No scans found. Upload a document to generate a report.");
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching report:", err);
                setError("Failed to load report");
            } finally {
                setLoading(false);
            }
        }

        fetchReport();
    }, [scanId]);

    const handleExportPDF = async () => {
        if (!scan) return;
        setDownloading(true);
        try {
            const response = await fetch("/api/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scanId: scan.id }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to generate PDF");
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
        } catch (err) {
            console.error("Export error:", err);
            alert(err instanceof Error ? err.message : "Failed to export PDF");
        } finally {
            setDownloading(false);
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
            year: "numeric", month: "long", day: "numeric",
            hour: "numeric", minute: "2-digit",
        });
    };

    const getScoreColor = (score: number) => {
        if (score > 50) return { bg: "bg-red-50", text: "text-red-600", badge: "bg-red-100 text-red-700" };
        if (score > 20) return { bg: "bg-yellow-50", text: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700" };
        return { bg: "bg-green-50", text: "text-green-600", badge: "bg-green-100 text-green-700" };
    };

    const getScoreLabel = (score: number) => {
        if (score > 50) return "High probability of AI content";
        if (score > 20) return "Moderate probability of AI content";
        return "Low probability of AI content";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading report...</p>
                </div>
            </div>
        );
    }

    if (error || !scan) {
        return (
            <div className="min-h-screen bg-slate-50 p-8">
                <div className="max-w-6xl mx-auto text-center py-20">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-700 mb-2">No Report Available</h2>
                    <p className="text-slate-500 mb-6">{error || "Upload a document to generate your first AI analysis report."}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25"
                    >
                        Upload a Document
                    </button>
                </div>
            </div>
        );
    }

    const aiScore = scan.ai_score ?? 0;
    const humanScore = 100 - aiScore;
    const colors = getScoreColor(aiScore);
    const isProcessing = scan.status !== "completed";

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-700 mb-2">AI Analysis Report</h1>
                        <p className="text-slate-500">Detailed AI detection results for your document</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportPDF}
                            disabled={downloading || isProcessing}
                            className="px-5 py-2.5 bg-white rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {downloading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export PDF
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => router.push("/files")}
                            className="px-5 py-2.5 bg-white rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            All Files
                        </button>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 mb-8">
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-slate-700">{scan.file_name}</h3>
                                <p className="text-slate-500">
                                    Scanned on {formatDate(scan.created_at)}
                                    {scan.file_size ? ` · ${formatFileSize(scan.file_size)}` : ""}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {isProcessing ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-slate-500 text-lg">Analysis in progress...</p>
                                <p className="text-slate-400 text-sm mt-1">This may take a few moments</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-4 gap-6">
                                <div className={`text-center p-6 ${colors.bg} rounded-xl`}>
                                    <div className={`text-4xl font-bold ${colors.text} mb-1`}>{aiScore}%</div>
                                    <div className="text-slate-500">AI Content</div>
                                </div>
                                <div className="text-center p-6 bg-slate-50 rounded-xl">
                                    <div className="text-4xl font-bold text-slate-700 mb-1">{humanScore}%</div>
                                    <div className="text-slate-500">Human Written</div>
                                </div>
                                <div className="text-center p-6 bg-slate-50 rounded-xl">
                                    <div className="text-4xl font-bold text-slate-700 mb-1">{scan.word_count?.toLocaleString() ?? "N/A"}</div>
                                    <div className="text-slate-500">Words Analyzed</div>
                                </div>
                                <div className="text-center p-6 bg-slate-50 rounded-xl">
                                    <div className="text-4xl font-bold text-slate-700 mb-1">{scan.paragraph_count ?? "N/A"}</div>
                                    <div className="text-slate-500">Paragraphs</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Analysis Result */}
                {!isProcessing && (
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 mb-8">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-semibold text-slate-700">Analysis Result</h2>
                            <p className="text-slate-500 mt-1">Overall AI detection assessment</p>
                        </div>
                        <div className="p-6">
                            <div className={`p-6 rounded-xl ${colors.bg}`}>
                                <div className="flex items-center gap-6 mb-4">
                                    <div className={`text-6xl font-bold ${colors.text}`}>{aiScore}%</div>
                                    <div>
                                        <p className="font-semibold text-slate-700 text-lg">{getScoreLabel(aiScore)}</p>
                                        <p className="text-slate-500 mt-1">
                                            {aiScore < 20
                                                ? "This document appears to be primarily human-written content."
                                                : aiScore < 50
                                                    ? "This document contains some patterns consistent with AI-generated text."
                                                    : "This document shows strong indicators of AI-generated content."}
                                        </p>
                                    </div>
                                </div>
                                {/* Score bar */}
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm text-slate-500 mb-2">
                                        <span>Human Written</span>
                                        <span>AI Generated</span>
                                    </div>
                                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${aiScore > 50 ? "bg-red-500" : aiScore > 20 ? "bg-yellow-500" : "bg-green-500"}`}
                                            style={{ width: `${aiScore}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Document Details */}
                {!isProcessing && (
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-semibold text-slate-700">Document Details</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 text-center">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="text-lg font-semibold text-blue-600 mb-1">File Type</div>
                                    <div className="text-slate-500 uppercase">{scan.file_type || "Unknown"}</div>
                                </div>
                                <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 text-center">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                        </svg>
                                    </div>
                                    <div className="text-lg font-semibold text-purple-600 mb-1">File Size</div>
                                    <div className="text-slate-500">{formatFileSize(scan.file_size)}</div>
                                </div>
                                <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-white border border-green-100 text-center">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="text-lg font-semibold text-green-600 mb-1">Completed</div>
                                    <div className="text-slate-500">{scan.completed_at ? formatDate(scan.completed_at) : "N/A"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading report...</p>
                </div>
            </div>
        }>
            <ReportsPageContent />
        </Suspense>
    );
}
