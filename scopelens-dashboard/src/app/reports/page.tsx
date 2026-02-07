export default function ReportsPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Analysis Report</h1>
                        <p className="text-gray-500">Detailed AI detection results for your document</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-5 py-2.5 bg-white rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export PDF
                        </button>
                        <button className="px-5 py-2.5 bg-white rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                        </button>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 mb-8">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">research_paper_v2.pdf</h3>
                                <p className="text-gray-500">Scanned on January 15, 2024 at 2:34 PM</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid md:grid-cols-4 gap-6">
                            <div className="text-center p-6 bg-green-50 rounded-xl">
                                <div className="text-4xl font-bold text-green-600 mb-1">12%</div>
                                <div className="text-gray-500">AI Content</div>
                            </div>
                            <div className="text-center p-6 bg-gray-50 rounded-xl">
                                <div className="text-4xl font-bold text-gray-900 mb-1">88%</div>
                                <div className="text-gray-500">Human Written</div>
                            </div>
                            <div className="text-center p-6 bg-gray-50 rounded-xl">
                                <div className="text-4xl font-bold text-gray-900 mb-1">2,847</div>
                                <div className="text-gray-500">Words Analyzed</div>
                            </div>
                            <div className="text-center p-6 bg-gray-50 rounded-xl">
                                <div className="text-4xl font-bold text-gray-900 mb-1">14</div>
                                <div className="text-gray-500">Paragraphs</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Analysis */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 mb-8">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-900">Content Analysis</h2>
                        <p className="text-gray-500 mt-1">Paragraph-by-paragraph breakdown</p>
                    </div>
                    <div className="p-6 space-y-4">
                        {[
                            { para: 1, text: "The rapid advancement of artificial intelligence has fundamentally transformed how we approach complex problem-solving...", score: 5 },
                            { para: 2, text: "Machine learning algorithms have demonstrated remarkable capabilities in pattern recognition and predictive analytics...", score: 78 },
                            { para: 3, text: "This research examines the implications of these developments across various industry sectors...", score: 8 },
                        ].map((item) => (
                            <div
                                key={item.para}
                                className={`p-5 rounded-xl border-l-4 transition-shadow hover:shadow-md ${item.score > 50
                                        ? 'border-l-red-500 bg-red-50/50'
                                        : 'border-l-green-500 bg-green-50/50'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-medium text-gray-900">Paragraph {item.para}</span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${item.score > 50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {item.score}% AI
                                    </span>
                                </div>
                                <p className="text-gray-600">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detection Models */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-900">Detection Models Used</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="text-lg font-semibold text-blue-600 mb-1">GPT Detector</div>
                                <div className="text-gray-500">Confidence: 94%</div>
                            </div>
                            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 text-center">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="text-lg font-semibold text-purple-600 mb-1">Claude Detector</div>
                                <div className="text-gray-500">Confidence: 91%</div>
                            </div>
                            <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-white border border-green-100 text-center">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                                <div className="text-lg font-semibold text-green-600 mb-1">Ensemble Model</div>
                                <div className="text-gray-500">Confidence: 96%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
