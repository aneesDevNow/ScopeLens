import React from "react";
import {
    Document, Page, View, Text, StyleSheet,
    Svg, Circle, Path, Line,
} from "@react-pdf/renderer";
import { C, M, s, shortId } from "./reportStyles";
import type { DocParagraph } from "./reportStyles";

/* ═══════════════════════════════════════════
   Constants — Source Colors (Turnitin-style)
   ═══════════════════════════════════════════ */
const SOURCE_COLORS = [
    "#EF4444", // 1  red
    "#F97316", // 2  orange
    "#3B82F6", // 3  blue
    "#22C55E", // 4  green
    "#EC4899", // 5  pink
    "#8B5CF6", // 6  purple
    "#14B8A6", // 7  teal
    "#F59E0B", // 8  amber
    "#6366F1", // 9  indigo
    "#06B6D4", // 10 cyan
    "#D946EF", // 11 fuchsia
    "#84CC16", // 12 lime
    "#E11D48", // 13 rose
    "#0EA5E9", // 14 sky
    "#A855F7", // 15 violet
    "#FB923C", // 16 orange-light
    "#4ADE80", // 17 green-light
    "#38BDF8", // 18 sky-light
    "#C084FC", // 19 purple-light
    "#F87171", // 20 red-light
];

/** Map a source color to a light background tint for text highlighting */
function sourceHighlightBg(colorIdx: number): string {
    const lightBgs = [
        "#FEE2E2", // red
        "#FFEDD5", // orange
        "#DBEAFE", // blue
        "#DCFCE7", // green
        "#FCE7F3", // pink
        "#EDE9FE", // purple
        "#CCFBF1", // teal
        "#FEF3C7", // amber
        "#E0E7FF", // indigo
        "#CFFAFE", // cyan
        "#FAE8FF", // fuchsia
        "#ECFCCB", // lime
        "#FFE4E6", // rose
        "#E0F2FE", // sky
        "#F3E8FF", // violet
        "#FED7AA", // orange-light
        "#BBF7D0", // green-light
        "#BAE6FD", // sky-light
        "#E9D5FF", // purple-light
        "#FECACA", // red-light
    ];
    return lightBgs[colorIdx % lightBgs.length];
}

function getSourceColor(idx: number): string {
    return SOURCE_COLORS[idx % SOURCE_COLORS.length];
}

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */
interface MatchedSource {
    title: string;
    authors: string[];
    year: number | null;
    doi: string | null;
    url: string | null;
    matchPercentage: number;
    matchedSentences: { index: number; sentence: string; similarity: number }[];
    sourceType: string;
}

export interface PlagiarismReportProps {
    authorName: string;
    fileName: string;
    fileSize: string;
    submissionDate: string;
    downloadDate: string;
    reportId: string;
    plagiarismPercent: number;
    paragraphs: DocParagraph[];
    highlightedSentences: string[];
    /** map of sentence text → array of source indices (0-based) */
    sentenceSourceMap: Record<string, number[]>;
    totalSentences: number;
    matchedSentenceCount: number;
    sources: MatchedSource[];
    totalWords: number;
    customLogoSrc?: string;
}

/* ═══════════════════════════════════════════
   SVG Components
   ═══════════════════════════════════════════ */
function ScopeLensLogo({ size = 22 }: { size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="48" fill={C.blue500} />
            <Circle cx="50" cy="44" r="22" fill="none" stroke={C.white} strokeWidth="5" />
            <Circle cx="50" cy="44" r="15" fill="none" stroke={C.white} strokeWidth="3" />
            <Line x1="65" y1="60" x2="78" y2="75" stroke={C.white} strokeWidth="7" strokeLinecap="round" />
        </Svg>
    );
}

/* ═══════════════════════════════════════════
   Header / Footer
   ═══════════════════════════════════════════ */
function Header({ reportId, label, logoSrc }: { reportId: string; label: string; logoSrc?: string }) {
    return (
        <View style={s.hdr} fixed>
            <View style={s.hdrLeft}>
                <ScopeLensLogo size={22} />
                <Text style={s.hdrBrand}>ScopeLens</Text>
                <Text style={s.hdrInfo} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
                    `Page ${pageNumber} of ${totalPages} · ${label}`
                } />
            </View>
            <Text style={s.hdrId}>Report ID   {shortId(reportId)}</Text>
        </View>
    );
}

function Footer({ reportId, label }: { reportId: string; label: string; logoSrc?: string }) {
    return (
        <View style={{
            position: "absolute", bottom: 20, left: 50, right: 50,
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            borderTopWidth: 0.5, borderTopColor: "#E2E8F0", paddingTop: 8,
        }} fixed>
            <View style={s.hdrLeft}>
                <ScopeLensLogo size={14} />
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.blue500, marginLeft: 4 }}>ScopeLens</Text>
                <Text style={{ fontSize: 7, color: C.slate500, marginLeft: 12 }} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
                    `Page ${pageNumber} of ${totalPages} · ${label}`
                } />
            </View>
            <Text style={{ fontSize: 7, color: C.slate500 }}>Report ID   {shortId(reportId)}</Text>
        </View>
    );
}

/* ═══════════════════════════════════════════
   Numbered Source Badge
   ═══════════════════════════════════════════ */
function SourceBadge({ num, size = 18 }: { num: number; size?: number }) {
    const color = getSourceColor(num - 1);
    return (
        <View style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color, alignItems: "center", justifyContent: "center",
        }}>
            <Text style={{ fontSize: size * 0.55, fontFamily: "Helvetica-Bold", color: "#FFFFFF" }}>
                {num}
            </Text>
        </View>
    );
}

/* ═══════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════ */
const ps = StyleSheet.create({
    // Cover
    coverBg: { backgroundColor: "#1a1a2e", flex: 1, padding: 50, justifyContent: "center" },
    coverTitle: { fontSize: 32, fontFamily: "Helvetica-Bold", color: "#FFFFFF", marginBottom: 8 },
    coverSubtitle: { fontSize: 14, color: "#94A3B8", marginBottom: 40 },
    coverBoxRow: { flexDirection: "row", gap: 15, marginBottom: 20 },
    coverBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 16 },
    coverBoxLabel: { fontSize: 8, color: "#94A3B8", marginBottom: 4 },
    coverBoxValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
    scoreCircleBg: { alignItems: "center", marginBottom: 30 },
    // Overview
    sectionTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#181818", marginBottom: 12 },
    overviewRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
    overviewCard: { flex: 1, backgroundColor: "#F8FAFC", borderRadius: 6, padding: 12, borderWidth: 0.5, borderColor: "#E2E8F0" },
    overviewLabel: { fontSize: 7, color: "#64748B", marginBottom: 3 },
    overviewValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#181818" },
    // Sources page
    sourceRow: { flexDirection: "row", alignItems: "center", marginBottom: 4, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: "#F1F5F9" },
    sourceInfo: { flex: 1, marginLeft: 8 },
    sourceTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#181818" },
    sourceDetail: { fontSize: 7, color: "#64748B", marginTop: 1 },
    sourceTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, marginLeft: 6 },
    sourceTypeBadgeText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
    sourcePercent: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#64748B", width: 40, textAlign: "right" },
    noSources: { fontSize: 10, color: "#64748B", textAlign: "center", paddingVertical: 40 },
    // Content page
    paraBlock: { marginBottom: 6 },
    normalText: { fontSize: 12, fontFamily: "Times-Roman", color: "#181818", lineHeight: 1.6, textAlign: "justify" as const },
    titleText: { fontSize: 20, fontFamily: "Times-Bold", color: "#181818", marginTop: 8, marginBottom: 4 },
    h1Text: { fontSize: 17, fontFamily: "Times-Bold", color: "#181818", marginTop: 8, marginBottom: 3 },
    h2Text: { fontSize: 14, fontFamily: "Times-Bold", color: "#181818", marginTop: 6, marginBottom: 2 },
    tblWrap: { marginVertical: 8, borderWidth: 0.5, borderColor: "#D1D5DB" },
    tblRow: { flexDirection: "row" as const, borderBottomWidth: 0.5, borderBottomColor: "#D1D5DB" },
    tblHeaderCell: { flex: 1, padding: 5, backgroundColor: "#F3F4F6", borderRightWidth: 0.5, borderRightColor: "#D1D5DB" },
    tblCell: { flex: 1, padding: 5, borderRightWidth: 0.5, borderRightColor: "#D1D5DB" },
    tblHeaderText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#181818" },
    tblCellText: { fontSize: 9, fontFamily: "Times-Roman", color: "#181818" },
    // Margin badge
    marginBadgeWrap: { flexDirection: "row" as const, alignItems: "flex-start" as const, marginBottom: 6 },
    marginBadgeCol: { width: 36, flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 1, marginRight: 4, paddingTop: 2 },
    contentCol: { flex: 1 },
});

/* ═══════════════════════════════════════════
   Source type label color
   ═══════════════════════════════════════════ */
function sourceTypeBgColor(type: string): string {
    const t = type.toLowerCase();
    if (t.includes("internet")) return "#3B82F6";
    if (t.includes("publication") || t.includes("journal")) return "#8B5CF6";
    if (t.includes("student")) return "#22C55E";
    return "#64748B";
}

/* ═══════════════════════════════════════════
   PAGE 1: Cover Page
   ═══════════════════════════════════════════ */
function CoverPage(p: PlagiarismReportProps) {
    const scoreColor = p.plagiarismPercent > 30 ? "#EF4444" : p.plagiarismPercent > 15 ? "#F59E0B" : "#22C55E";
    return (
        <Page size="A4" style={{ padding: 0 }}>
            <View style={ps.coverBg}>
                <Text style={ps.coverTitle}>Plagiarism Report</Text>
                <Text style={ps.coverSubtitle}>ScopeLens Document Analysis</Text>

                <View style={ps.scoreCircleBg}>
                    <View style={{ width: 120, height: 120, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: scoreColor, borderRadius: 60, marginBottom: 8 }}>
                        <Text style={{ fontSize: 28, fontFamily: "Helvetica-Bold", color: scoreColor }}>{p.plagiarismPercent}%</Text>
                        <Text style={{ fontSize: 8, color: "#94A3B8" }}>Similarity</Text>
                    </View>
                </View>

                <View style={ps.coverBoxRow}>
                    <View style={ps.coverBox}>
                        <Text style={ps.coverBoxLabel}>Document</Text>
                        <Text style={ps.coverBoxValue}>{p.fileName}</Text>
                    </View>
                    <View style={ps.coverBox}>
                        <Text style={ps.coverBoxLabel}>Author</Text>
                        <Text style={ps.coverBoxValue}>{p.authorName}</Text>
                    </View>
                </View>
                <View style={ps.coverBoxRow}>
                    <View style={ps.coverBox}>
                        <Text style={ps.coverBoxLabel}>Submitted</Text>
                        <Text style={ps.coverBoxValue}>{p.submissionDate}</Text>
                    </View>
                    <View style={ps.coverBox}>
                        <Text style={ps.coverBoxLabel}>File Size</Text>
                        <Text style={ps.coverBoxValue}>{p.fileSize}</Text>
                    </View>
                </View>
                <View style={ps.coverBoxRow}>
                    <View style={ps.coverBox}>
                        <Text style={ps.coverBoxLabel}>Words</Text>
                        <Text style={ps.coverBoxValue}>{p.totalWords.toLocaleString()}</Text>
                    </View>
                    <View style={ps.coverBox}>
                        <Text style={ps.coverBoxLabel}>Sources Found</Text>
                        <Text style={ps.coverBoxValue}>{p.sources.length}</Text>
                    </View>
                </View>

                <View style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 7, color: "#64748B" }}>Report ID: {p.reportId}</Text>
                    <Text style={{ fontSize: 7, color: "#64748B" }}>Downloaded: {p.downloadDate}</Text>
                </View>
            </View>
        </Page>
    );
}

/* ═══════════════════════════════════════════
   PAGE 2: Integrity Overview (stat cards)
   ═══════════════════════════════════════════ */
function OverviewPage(p: PlagiarismReportProps) {
    const scoreColor = p.plagiarismPercent > 30 ? "#EF4444" : p.plagiarismPercent > 15 ? "#F59E0B" : "#22C55E";
    const originalPercent = 100 - p.plagiarismPercent;
    return (
        <Page size="A4" style={s.page}>
            <Header reportId={p.reportId} label="Integrity Overview" logoSrc={p.customLogoSrc} />

            <Text style={ps.sectionTitle}>Plagiarism Overview</Text>

            <View style={ps.overviewRow}>
                <View style={ps.overviewCard}>
                    <Text style={ps.overviewLabel}>Overall Similarity</Text>
                    <Text style={[ps.overviewValue, { color: scoreColor }]}>{p.plagiarismPercent}%</Text>
                </View>
                <View style={ps.overviewCard}>
                    <Text style={ps.overviewLabel}>Original Content</Text>
                    <Text style={[ps.overviewValue, { color: "#22C55E" }]}>{originalPercent}%</Text>
                </View>
                <View style={ps.overviewCard}>
                    <Text style={ps.overviewLabel}>Sources Found</Text>
                    <Text style={ps.overviewValue}>{p.sources.length}</Text>
                </View>
            </View>

            <View style={ps.overviewRow}>
                <View style={ps.overviewCard}>
                    <Text style={ps.overviewLabel}>Total Sentences</Text>
                    <Text style={ps.overviewValue}>{p.totalSentences}</Text>
                </View>
                <View style={ps.overviewCard}>
                    <Text style={ps.overviewLabel}>Matched Sentences</Text>
                    <Text style={[ps.overviewValue, { color: "#F59E0B" }]}>{p.matchedSentenceCount}</Text>
                </View>
                <View style={ps.overviewCard}>
                    <Text style={ps.overviewLabel}>Total Words</Text>
                    <Text style={ps.overviewValue}>{p.totalWords.toLocaleString()}</Text>
                </View>
            </View>

            <View style={s.sep} />

            {/* Similarity bar */}
            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#181818", marginBottom: 8 }}>Similarity Breakdown</Text>
                <View style={{ height: 14, backgroundColor: "#E2E8F0", borderRadius: 7, overflow: "hidden", flexDirection: "row" }}>
                    {p.plagiarismPercent > 0 && (
                        <View style={{ width: `${p.plagiarismPercent}%`, backgroundColor: scoreColor, borderRadius: 7 }} />
                    )}
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                    <Text style={{ fontSize: 7, color: scoreColor }}>Matched ({p.plagiarismPercent}%)</Text>
                    <Text style={{ fontSize: 7, color: "#22C55E" }}>Original ({originalPercent}%)</Text>
                </View>
            </View>

            <View style={s.sep} />

            <Text style={{ fontSize: 8, color: "#64748B", lineHeight: 1.6 }}>
                This report compares your document against academic publications indexed by CORE (core.ac.uk).
                The similarity percentage represents the proportion of sentences in your document that show
                significant textual overlap with published sources. Each matched source is assigned a unique
                color and number for easy identification throughout the document.
            </Text>

            <Footer reportId={p.reportId} label="Integrity Overview" logoSrc={p.customLogoSrc} />
        </Page>
    );
}

/* ═══════════════════════════════════════════
   PAGE 3: Top Sources (Turnitin-style list)
   ═══════════════════════════════════════════ */
function TopSourcesPage({ sources, reportId, customLogoSrc }: {
    sources: MatchedSource[];
    reportId: string;
    customLogoSrc?: string;
}) {
    if (sources.length === 0) {
        return (
            <Page size="A4" style={s.page}>
                <Header reportId={reportId} label="Integrity Overview" logoSrc={customLogoSrc} />
                <Text style={ps.sectionTitle}>Top Sources</Text>
                <Text style={ps.noSources}>No matching sources were found. Your document appears to be original.</Text>
                <Footer reportId={reportId} label="Integrity Overview" logoSrc={customLogoSrc} />
            </Page>
        );
    }

    return (
        <Page size="A4" style={s.page} wrap>
            <Header reportId={reportId} label="Integrity Overview" logoSrc={customLogoSrc} />

            <Text style={ps.sectionTitle}>Top Sources</Text>
            <Text style={{ fontSize: 7, color: "#94A3B8", marginBottom: 14 }}>
                The sources with the highest number of matches within the submission. Overlapping sources will not be displayed.
            </Text>

            {sources.map((source, idx) => {
                const typeColor = sourceTypeBgColor(source.sourceType);
                const displayPercent = source.matchPercentage < 1 ? "<1%" : `${source.matchPercentage}%`;
                // Derive a display title/url
                const displayTitle = source.url || source.title;

                return (
                    <View key={idx} style={ps.sourceRow} wrap={false}>
                        <SourceBadge num={idx + 1} size={20} />
                        <View style={[ps.sourceTypeBadge, { backgroundColor: typeColor }]}>
                            <Text style={ps.sourceTypeBadgeText}>{source.sourceType || "Publication"}</Text>
                        </View>
                        <View style={ps.sourceInfo}>
                            <Text style={ps.sourceTitle} wrap={false}>
                                {source.authors.length > 0
                                    ? `${source.authors.slice(0, 3).join(", ")}${source.authors.length > 3 ? ` et al.` : ""} ${source.title ? `"${source.title.substring(0, 60)}${source.title.length > 60 ? "..." : ""}"` : ""}`
                                    : displayTitle
                                }
                            </Text>
                            {source.year && (
                                <Text style={ps.sourceDetail}>
                                    {source.year}{source.doi ? ` · DOI: ${source.doi}` : ""}
                                </Text>
                            )}
                        </View>
                        <Text style={ps.sourcePercent}>{displayPercent}</Text>
                    </View>
                );
            })}

            <Footer reportId={reportId} label="Integrity Overview" logoSrc={customLogoSrc} />
        </Page>
    );
}

/* ═══════════════════════════════════════════
   PAGES: Document Content with Color-Coded
          Per-Source Highlights & Margin Badges
   ═══════════════════════════════════════════ */
function PlagiarismContentPage({ paragraphs, highlightedSentences, sentenceSourceMap, reportId, customLogoSrc }: {
    paragraphs: DocParagraph[];
    highlightedSentences: string[];
    sentenceSourceMap: Record<string, number[]>;
    reportId: string;
    customLogoSrc?: string;
}) {
    /** Check if a sentence is highlighted and return its source indices (1-based for display) */
    const getMatchInfo = (sentence: string): number[] => {
        // Direct match
        if (sentenceSourceMap[sentence]) return sentenceSourceMap[sentence];
        // Substring match
        for (const key of Object.keys(sentenceSourceMap)) {
            if (sentence.includes(key) || key.includes(sentence)) {
                return sentenceSourceMap[key];
            }
        }
        // Fallback: check highlighted list
        if (highlightedSentences.some((h) => sentence.includes(h) || h.includes(sentence))) {
            return [0]; // unknown source
        }
        return [];
    };

    return (
        <Page size="A4" style={s.page} wrap>
            <Header reportId={reportId} label="Integrity Submission" logoSrc={customLogoSrc} />

            {paragraphs.map((para, pi) => {
                if (para.style === "Title") {
                    return <Text key={pi} style={ps.titleText}>{para.text}</Text>;
                }
                if (para.style === "Heading1") {
                    const hlSources = getMatchInfo(para.text);
                    if (hlSources.length > 0) {
                        const bgColor = sourceHighlightBg(hlSources[0]);
                        return (
                            <View key={pi} style={ps.marginBadgeWrap} wrap={false}>
                                <View style={ps.marginBadgeCol}>
                                    {hlSources.map((si, i) => <SourceBadge key={i} num={si + 1} size={14} />)}
                                </View>
                                <Text style={[ps.h1Text, { backgroundColor: bgColor, flex: 1 }]}>{para.text}</Text>
                            </View>
                        );
                    }
                    return <Text key={pi} style={ps.h1Text}>{para.text}</Text>;
                }
                if (para.style === "Heading2") {
                    const hlSources = getMatchInfo(para.text);
                    if (hlSources.length > 0) {
                        const bgColor = sourceHighlightBg(hlSources[0]);
                        return (
                            <View key={pi} style={ps.marginBadgeWrap} wrap={false}>
                                <View style={ps.marginBadgeCol}>
                                    {hlSources.map((si, i) => <SourceBadge key={i} num={si + 1} size={14} />)}
                                </View>
                                <Text style={[ps.h2Text, { backgroundColor: bgColor, flex: 1 }]}>{para.text}</Text>
                            </View>
                        );
                    }
                    return <Text key={pi} style={ps.h2Text}>{para.text}</Text>;
                }

                // Table rendering
                if (para.style === "Table" && para.rows && para.rows.length > 0) {
                    return (
                        <View key={pi} style={ps.tblWrap} wrap={false}>
                            {para.rows.map((row, ri) => (
                                <View key={ri} style={ps.tblRow}>
                                    {row.map((cell, ci) => {
                                        const hlS = ri > 0 ? getMatchInfo(cell) : [];
                                        const cellStyle = ri === 0 ? ps.tblHeaderCell
                                            : hlS.length > 0 ? { ...ps.tblCell, backgroundColor: sourceHighlightBg(hlS[0]) }
                                                : ps.tblCell;
                                        const textStyle = ri === 0 ? ps.tblHeaderText : ps.tblCellText;
                                        return (
                                            <View key={ci} style={cellStyle}>
                                                <Text style={textStyle}>{cell}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    );
                }

                // Normal paragraph — split into sentences for per-source highlighting
                const sentences = para.text.split(/(?<=[.!?])\s+/);

                // Collect all source badges needed for this paragraph
                const paraBadges: number[] = [];
                for (const sent of sentences) {
                    for (const si of getMatchInfo(sent)) {
                        if (!paraBadges.includes(si)) paraBadges.push(si);
                    }
                }

                if (paraBadges.length > 0) {
                    return (
                        <View key={pi} style={ps.marginBadgeWrap} wrap={false}>
                            <View style={ps.marginBadgeCol}>
                                {paraBadges.map((si, i) => <SourceBadge key={i} num={si + 1} size={14} />)}
                            </View>
                            <View style={ps.contentCol}>
                                <Text>
                                    {sentences.map((sent, si) => {
                                        const matchSources = getMatchInfo(sent);
                                        if (matchSources.length > 0) {
                                            const bgColor = sourceHighlightBg(matchSources[0]);
                                            return (
                                                <Text key={si} style={[ps.normalText, { backgroundColor: bgColor }]}>
                                                    {sent}{si < sentences.length - 1 ? " " : ""}
                                                </Text>
                                            );
                                        }
                                        return (
                                            <Text key={si} style={ps.normalText}>
                                                {sent}{si < sentences.length - 1 ? " " : ""}
                                            </Text>
                                        );
                                    })}
                                </Text>
                            </View>
                        </View>
                    );
                }

                // No matches — render normally
                return (
                    <View key={pi} style={ps.paraBlock} wrap={false}>
                        <Text style={ps.normalText}>{para.text}</Text>
                    </View>
                );
            })}

            <Footer reportId={reportId} label="Integrity Submission" logoSrc={customLogoSrc} />
        </Page>
    );
}

/* ═══════════════════════════════════════════
   Main Document
   ═══════════════════════════════════════════ */
export function PlagiarismReportDocument(props: PlagiarismReportProps) {
    return (
        <Document
            title={`Plagiarism Report - ${props.fileName}`}
            author="ScopeLens"
            subject="Plagiarism Detection Report"
        >
            <CoverPage {...props} />
            <OverviewPage {...props} />
            <TopSourcesPage
                sources={props.sources}
                reportId={props.reportId}
                customLogoSrc={props.customLogoSrc}
            />
            {props.paragraphs.length > 0 && (
                <PlagiarismContentPage
                    paragraphs={props.paragraphs}
                    highlightedSentences={props.highlightedSentences}
                    sentenceSourceMap={props.sentenceSourceMap}
                    reportId={props.reportId}
                    customLogoSrc={props.customLogoSrc}
                />
            )}
        </Document>
    );
}

export default PlagiarismReportDocument;
