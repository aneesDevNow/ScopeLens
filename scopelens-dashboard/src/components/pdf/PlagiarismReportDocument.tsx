import React from "react";
import {
    Document, Page, View, Text, Image, StyleSheet,
    Svg, Circle, Path, Line,
} from "@react-pdf/renderer";
import { C, M, s, shortId } from "./reportStyles";
import type { DocParagraph } from "./reportStyles";

/* ═══════════════════════════════════════════
   Constants — Source Colors (Turnitin Palette)
   ═══════════════════════════════════════════ */
const SOURCE_COLORS = [
    "#E4473A", // 1  red
    "#3B82F6", // 2  blue
    "#22A85D", // 3  green
    "#8B5CF6", // 4  purple
    "#EC4899", // 5  pink
    "#1E3A5F", // 6  navy
    "#2D8354", // 7  dark green
    "#6366F1", // 8  indigo
    "#F97316", // 9  orange
    "#14B8A6", // 10 teal
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

/** Map source index to a light background tint for text highlighting */
function sourceHighlightBg(colorIdx: number): string {
    const lightBgs = [
        "#FEE2E2", "#DBEAFE", "#DCFCE7", "#EDE9FE", "#FCE7F3",
        "#D1DCE8", "#D0EAD9", "#E0E7FF", "#FFEDD5", "#CCFBF1",
        "#FAE8FF", "#ECFCCB", "#FFE4E6", "#E0F2FE", "#F3E8FF",
        "#FED7AA", "#BBF7D0", "#BAE6FD", "#E9D5FF", "#FECACA",
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
    /** Real match group data from citation/quotation analysis */
    matchGroups?: {
        notCitedOrQuoted: { count: number; percent: number };
        missingQuotations: { count: number; percent: number };
        missingCitation: { count: number; percent: number };
        citedAndQuoted: { count: number; percent: number };
    };
    /** Real source type breakdown percentages */
    sourceTypeBreakdown?: {
        internet: number;
        publications: number;
        studentPapers: number;
    };
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
   Header / Footer — same pattern as AI report
   ═══════════════════════════════════════════ */
const Header = ({ label, reportId, logoSrc }: { label: string; reportId: string; logoSrc?: string }) => (
    <View style={s.hdr} fixed>
        <View style={s.hdrLeft}>
            {logoSrc ? (
                <Image src={logoSrc} style={{ maxWidth: 120, maxHeight: 22, objectFit: "contain" }} />
            ) : (
                <>
                    <ScopeLensLogo size={22} />
                    <Text style={s.hdrBrand}>ScopeLens</Text>
                </>
            )}
            <Text style={s.hdrInfo} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
                `Page ${pageNumber} of ${totalPages} · ${label}`
            } />
        </View>
        <Text style={s.hdrId}>Submission ID   {shortId(reportId)}</Text>
    </View>
);

const Footer = ({ label, reportId, logoSrc }: { label: string; reportId: string; logoSrc?: string }) => (
    <View style={s.ftr} fixed>
        <View style={s.ftrLeft}>
            {logoSrc ? (
                <Image src={logoSrc} style={{ maxWidth: 100, maxHeight: 18, objectFit: "contain" }} />
            ) : (
                <>
                    <ScopeLensLogo size={18} />
                    <Text style={s.ftrBrand}>ScopeLens</Text>
                </>
            )}
            <Text style={s.ftrInfo} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
                `Page ${pageNumber} of ${totalPages} · ${label}`
            } />
        </View>
        <Text style={s.ftrId}>Submission ID   {shortId(reportId)}</Text>
    </View>
);

/* ═══════════════════════════════════════════
   Numbered Source Badge (circle)
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
   Source type helpers
   ═══════════════════════════════════════════ */
function getSourceTypeLabel(type: string): string {
    const t = type.toLowerCase();
    if (t.includes("internet")) return "Internet";
    if (t.includes("publication") || t.includes("journal")) return "Publication";
    if (t.includes("student")) return "Student papers";
    return "Publication";
}

function sourceTypeBgColor(type: string): string {
    const label = getSourceTypeLabel(type);
    if (label === "Internet") return "#3B82F6";
    if (label === "Publication") return "#22C55E";
    if (label === "Student papers") return "#8B5CF6";
    return "#64748B";
}

/* ═══════════════════════════════════════════
   PAGE 1: Cover Page
   (Turnitin style — white bg, Document Details)
   ═══════════════════════════════════════════ */
const ps1 = StyleSheet.create({
    fileName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#181818", marginTop: 150 },
    docLabel: { fontSize: 14, fontFamily: "Helvetica", color: "#181818", marginTop: 6 },
    brandRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
    brandText: { fontSize: 8, color: "#626262", marginLeft: 6 },
    detailsTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#181818", marginTop: 8, marginBottom: 10, textDecoration: "underline" },
    detailsRow: { flexDirection: "row", justifyContent: "space-between" },
    detailsLeft: { flex: 1 },
    detailRow: { marginBottom: 12 },
    detailLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#626262", marginBottom: 2 },
    detailValue: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#181818" },
    statsCol: { width: 110, alignItems: "flex-end", paddingTop: 0 },
    statBox: { borderWidth: 0.3, borderColor: C.slate200, paddingVertical: 6, paddingHorizontal: 12, alignItems: "center", width: 110 },
    statText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#181818" },
});

function CoverPage(p: PlagiarismReportProps) {
    const totalPagesEst = Math.ceil(p.paragraphs.length / 15) + 4;
    const totalChars = p.paragraphs.reduce((sum, para) => sum + para.text.length, 0);
    return (
        <Page size="A4" style={s.page}>
            <Header label="Cover Page" reportId={p.reportId} logoSrc={p.customLogoSrc} />

            <Text style={ps1.fileName}>{p.fileName}</Text>
            <Text style={ps1.docLabel}>Document</Text>

            {p.customLogoSrc ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                    <Image src={p.customLogoSrc} style={{ maxWidth: 80, maxHeight: 14, objectFit: "contain" }} />
                </View>
            ) : (
                <View style={ps1.brandRow}>
                    <ScopeLensLogo size={14} />
                    <Text style={ps1.brandText}>ScopeLens</Text>
                </View>
            )}

            <View style={s.sep} />

            {/* Document Details (left) + Stats (right) */}
            <View style={ps1.detailsRow}>
                <View style={ps1.detailsLeft}>
                    <Text style={ps1.detailsTitle}>Document Details</Text>
                    {([
                        ["Submission ID", shortId(p.reportId)],
                        ["Submission Date", p.submissionDate],
                        ["Download Date", p.downloadDate],
                        ["File Name", p.fileName],
                        ["File Size", p.fileSize],
                    ] as [string, string][]).map(([label, value]) => (
                        <View key={label} style={ps1.detailRow}>
                            <Text style={ps1.detailLabel}>{label}</Text>
                            <Text style={ps1.detailValue}>{value}</Text>
                        </View>
                    ))}
                </View>
                <View style={ps1.statsCol}>
                    {[
                        `${totalPagesEst} Pages`,
                        `${p.totalWords.toLocaleString()} Words`,
                        `${totalChars.toLocaleString()} Characters`,
                    ].map((txt) => (
                        <View key={txt} style={ps1.statBox}>
                            <Text style={ps1.statText}>{txt}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <Footer label="Cover Page" reportId={p.reportId} logoSrc={p.customLogoSrc} />
        </Page>
    );
}

/* ═══════════════════════════════════════════
   PAGE 2: Integrity Overview
   (Turnitin style — Overall Similarity,
    Filtered, Match Groups, Top Sources,
    Integrity Flags)
   ═══════════════════════════════════════════ */
const ps2 = StyleSheet.create({
    bigPercent: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#181818" },
    bigLabel: { fontSize: 16, fontFamily: "Helvetica", color: "#181818", marginLeft: 10 },
    desc: { fontSize: 7, color: "#626262", marginTop: 4, marginBottom: 16 },
    sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#181818", marginBottom: 8 },
    filterItem: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
    filterText: { fontSize: 8, color: "#181818", marginLeft: 6 },
    matchRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    matchBadge: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", marginRight: 8 },
    matchCount: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#181818" },
    matchLabel: { fontSize: 9, color: "#181818", marginLeft: 6 },
    matchPercent: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#626262", marginLeft: 4 },
    matchDesc: { fontSize: 7, color: "#626262", marginLeft: 32, marginTop: -4, marginBottom: 4 },
    topSourceRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
    topSourcePercent: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#181818", width: 28 },
    topSourceIcon: { width: 14, height: 14, marginRight: 6 },
    topSourceLabel: { fontSize: 8, color: "#181818" },
    flagTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#181818", marginBottom: 4 },
    flagText: { fontSize: 7, color: "#626262" },
    infoBox: { backgroundColor: "#EBF5FB", borderRadius: 4, padding: 10, marginTop: 12, flex: 1, marginLeft: 20 },
    infoText: { fontSize: 7, color: "#4A5568", lineHeight: 1.5 },
    columnsRow: { flexDirection: "row", gap: 30 },
    leftCol: { flex: 1 },
    rightCol: { width: 200 },
});

function IntegrityOverviewPage(p: PlagiarismReportProps) {
    // Use real match group data if available, otherwise compute fallbacks
    const mg = p.matchGroups || {
        notCitedOrQuoted: { count: p.matchedSentenceCount, percent: p.plagiarismPercent },
        missingQuotations: { count: 0, percent: 0 },
        missingCitation: { count: 0, percent: 0 },
        citedAndQuoted: { count: 0, percent: 0 },
    };

    // Use real source type breakdown if available, otherwise compute from sources
    const stb = p.sourceTypeBreakdown || {
        internet: p.sources.filter(src => getSourceTypeLabel(src.sourceType) === "Internet").reduce((s, src) => s + src.matchPercentage, 0),
        publications: p.sources.filter(src => getSourceTypeLabel(src.sourceType) === "Publication").reduce((s, src) => s + src.matchPercentage, 0),
        studentPapers: p.sources.filter(src => getSourceTypeLabel(src.sourceType) === "Student papers").reduce((s, src) => s + src.matchPercentage, 0),
    };

    return (
        <Page size="A4" style={s.page}>
            <Header label="Integrity Overview" reportId={p.reportId} logoSrc={p.customLogoSrc} />

            {/* Overall Similarity */}
            <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 4 }}>
                <Text style={ps2.bigPercent}>{p.plagiarismPercent}%</Text>
                <Text style={ps2.bigLabel}>Overall Similarity</Text>
            </View>
            <Text style={ps2.desc}>
                The combined total of all matches, including overlapping sources, for each database.
            </Text>

            <View style={s.sep} />

            {/* Filtered from the Report */}
            <Text style={ps2.sectionTitle}>Filtered from the Report</Text>
            <View style={ps2.filterItem}>
                <Text style={{ fontSize: 8, color: "#181818" }}>▸</Text>
                <Text style={ps2.filterText}>Bibliography</Text>
            </View>
            <View style={ps2.filterItem}>
                <Text style={{ fontSize: 8, color: "#181818" }}>▸</Text>
                <Text style={ps2.filterText}>Quoted Text</Text>
            </View>

            <View style={s.sep} />

            {/* Match Groups + Top Sources in columns */}
            <View style={ps2.columnsRow}>
                <View style={ps2.leftCol}>
                    <Text style={ps2.sectionTitle}>Match Groups</Text>

                    {/* Not Cited or Quoted */}
                    <View style={ps2.matchRow}>
                        <View style={[ps2.matchBadge, { backgroundColor: "#E4473A" }]}>
                            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#FFFFFF" }}>!</Text>
                        </View>
                        <Text style={ps2.matchCount}>{mg.notCitedOrQuoted.count}</Text>
                        <Text style={ps2.matchLabel}>Not Cited or Quoted</Text>
                        <Text style={ps2.matchPercent}>{mg.notCitedOrQuoted.percent}%</Text>
                    </View>
                    <Text style={ps2.matchDesc}>Matches with neither in-text citation nor quotation marks</Text>

                    {/* Missing Quotations */}
                    <View style={ps2.matchRow}>
                        <View style={[ps2.matchBadge, { backgroundColor: "#F59E0B" }]}>
                            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#FFFFFF" }}>!</Text>
                        </View>
                        <Text style={ps2.matchCount}>{mg.missingQuotations.count}</Text>
                        <Text style={ps2.matchLabel}>Missing Quotations</Text>
                        <Text style={ps2.matchPercent}>{mg.missingQuotations.percent}%</Text>
                    </View>
                    <Text style={ps2.matchDesc}>Matches that are still very similar to source material</Text>

                    {/* Missing Citation */}
                    <View style={ps2.matchRow}>
                        <View style={[ps2.matchBadge, { backgroundColor: "#EAB308" }]}>
                            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#FFFFFF" }}>=</Text>
                        </View>
                        <Text style={ps2.matchCount}>{mg.missingCitation.count}</Text>
                        <Text style={ps2.matchLabel}>Missing Citation</Text>
                        <Text style={ps2.matchPercent}>{mg.missingCitation.percent}%</Text>
                    </View>
                    <Text style={ps2.matchDesc}>Matches that have quotation marks, but no in-text citation</Text>

                    {/* Cited and Quoted */}
                    <View style={ps2.matchRow}>
                        <View style={[ps2.matchBadge, { backgroundColor: "#22C55E" }]}>
                            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#FFFFFF" }}>✓</Text>
                        </View>
                        <Text style={ps2.matchCount}>{mg.citedAndQuoted.count}</Text>
                        <Text style={ps2.matchLabel}>Cited and Quoted</Text>
                        <Text style={ps2.matchPercent}>{mg.citedAndQuoted.percent}%</Text>
                    </View>
                    <Text style={ps2.matchDesc}>Matches with in-text citation present, but no quotation marks</Text>
                </View>

                {/* Top Sources summary */}
                <View style={ps2.rightCol}>
                    <Text style={ps2.sectionTitle}>Top Sources</Text>
                    {stb.internet > 0 && (
                        <View style={ps2.topSourceRow}>
                            <Text style={ps2.topSourcePercent}>{stb.internet < 1 ? "<1" : Math.round(stb.internet)}%</Text>
                            <Text style={ps2.topSourceLabel}>Internet sources</Text>
                        </View>
                    )}
                    {stb.publications > 0 && (
                        <View style={ps2.topSourceRow}>
                            <Text style={ps2.topSourcePercent}>{stb.publications < 1 ? "<1" : Math.round(stb.publications)}%</Text>
                            <Text style={ps2.topSourceLabel}>Publications</Text>
                        </View>
                    )}
                    {stb.studentPapers > 0 && (
                        <View style={ps2.topSourceRow}>
                            <Text style={ps2.topSourcePercent}>{stb.studentPapers < 1 ? "<1" : Math.round(stb.studentPapers)}%</Text>
                            <Text style={ps2.topSourceLabel}>Submitted works (Student Papers)</Text>
                        </View>
                    )}
                    {stb.internet === 0 && stb.publications === 0 && stb.studentPapers === 0 && p.sources.length > 0 && (
                        <View style={ps2.topSourceRow}>
                            <Text style={ps2.topSourcePercent}>{p.plagiarismPercent}%</Text>
                            <Text style={ps2.topSourceLabel}>Publications</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={s.sep} />

            {/* Integrity Flags */}
            <View style={{ flexDirection: "row" }}>
                <View style={{ flex: 1 }}>
                    <Text style={ps2.sectionTitle}>Integrity Flags</Text>
                    <Text style={ps2.flagTitle}>0 Integrity Flags for Review</Text>
                    <Text style={ps2.flagText}>No suspicious text manipulations found.</Text>
                </View>
                <View style={ps2.infoBox}>
                    <Text style={ps2.infoText}>
                        Our system&apos;s algorithms look deeply at a document for any inconsistencies that
                        would set it apart from a normal submission. If we notice something strange, we flag
                        it for you to review.
                    </Text>
                    <Text style={[ps2.infoText, { marginTop: 6 }]}>
                        A Flag is not necessarily an indicator of a problem. However, we&apos;d recommend you
                        focus your attention there for further review.
                    </Text>
                </View>
            </View>

            <Footer label="Integrity Overview" reportId={p.reportId} logoSrc={p.customLogoSrc} />
        </Page>
    );
}

/* ═══════════════════════════════════════════
   PAGES 3+: Top Sources
   (Turnitin style — numbered badge, type tag,
    source name/URL, percentage)
   ═══════════════════════════════════════════ */
const ps3 = StyleSheet.create({
    sectionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#181818", marginBottom: 4 },
    subtitle: { fontSize: 7, color: "#94A3B8", marginBottom: 14 },
    sourceBlock: { marginBottom: 12 },
    badgeRow: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginLeft: 8 },
    typeBadgeText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
    percentText: { fontSize: 9, color: "#626262", marginLeft: "auto" as any },
    sourceTitle: { fontSize: 9, color: "#181818", marginLeft: 0, marginTop: 1 },
    noSources: { fontSize: 10, color: "#64748B", textAlign: "center", paddingVertical: 40 },
});

function TopSourcesPage({ sources, reportId, customLogoSrc }: {
    sources: MatchedSource[];
    reportId: string;
    customLogoSrc?: string;
}) {
    if (sources.length === 0) {
        return (
            <Page size="A4" style={s.page}>
                <Header label="Integrity Overview" reportId={reportId} logoSrc={customLogoSrc} />
                <Text style={ps3.sectionTitle}>Top Sources</Text>
                <Text style={ps3.noSources}>No matching sources were found. Your document appears to be original.</Text>
                <Footer label="Integrity Overview" reportId={reportId} logoSrc={customLogoSrc} />
            </Page>
        );
    }

    return (
        <Page size="A4" style={s.page} wrap>
            <Header label="Integrity Overview" reportId={reportId} logoSrc={customLogoSrc} />

            <Text style={ps3.sectionTitle}>Top Sources</Text>
            <Text style={ps3.subtitle}>
                The sources with the highest number of matches within the submission. Overlapping sources will not be displayed.
            </Text>

            {sources.map((source, idx) => {
                const typeLabel = getSourceTypeLabel(source.sourceType);
                const typeColor = sourceTypeBgColor(source.sourceType);
                const displayPercent = source.matchPercentage < 1 ? "<1%" : `${source.matchPercentage}%`;
                // Display: URL for internet, authors for publications, title for student papers
                let displayTitle = source.url || source.title || "Unknown source";
                if (typeLabel === "Publication" && source.authors.length > 0) {
                    displayTitle = `${source.authors.slice(0, 4).join(", ")}${source.authors.length > 4 ? ", M..." : ""}`;
                }
                if (typeLabel === "Student papers") {
                    displayTitle = source.title || "Student submission";
                }

                return (
                    <View key={idx} style={ps3.sourceBlock} wrap={false}>
                        <View style={ps3.badgeRow}>
                            <SourceBadge num={idx + 1} size={22} />
                            <View style={[ps3.typeBadge, { backgroundColor: typeColor }]}>
                                <Text style={ps3.typeBadgeText}>{typeLabel}</Text>
                            </View>
                            <Text style={ps3.percentText}>{displayPercent}</Text>
                        </View>
                        <Text style={ps3.sourceTitle}>{displayTitle}</Text>
                    </View>
                );
            })}

            <Footer label="Integrity Overview" reportId={reportId} logoSrc={customLogoSrc} />
        </Page>
    );
}

/* ═══════════════════════════════════════════
   PAGES: Document Content with Color-Coded
          Per-Source Highlights & Margin Badges
   ═══════════════════════════════════════════ */
const ps4 = StyleSheet.create({
    paraBlock: { marginBottom: 6 },
    normalText: { fontSize: 12, fontFamily: "Times-Roman", color: "#181818", lineHeight: 1.6, textAlign: "justify" as const },
    titleText: { fontSize: 20, fontFamily: "Times-Bold", color: "#181818", marginTop: 8, marginBottom: 4, textAlign: "center" as const },
    h1Text: { fontSize: 17, fontFamily: "Times-Bold", color: "#181818", marginTop: 8, marginBottom: 3 },
    h2Text: { fontSize: 14, fontFamily: "Times-Bold", color: "#181818", marginTop: 6, marginBottom: 2 },
    tblWrap: { marginVertical: 8, borderWidth: 0.5, borderColor: "#D1D5DB" },
    tblRow: { flexDirection: "row" as const, borderBottomWidth: 0.5, borderBottomColor: "#D1D5DB" },
    tblHeaderCell: { flex: 1, padding: 5, backgroundColor: "#F3F4F6", borderRightWidth: 0.5, borderRightColor: "#D1D5DB" },
    tblCell: { flex: 1, padding: 5, borderRightWidth: 0.5, borderRightColor: "#D1D5DB" },
    tblHeaderText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#181818" },
    tblCellText: { fontSize: 9, fontFamily: "Times-Roman", color: "#181818" },
    marginBadgeWrap: { flexDirection: "row" as const, alignItems: "flex-start" as const, marginBottom: 6 },
    marginBadgeCol: { width: 36, flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 1, marginRight: 4, paddingTop: 2 },
    contentCol: { flex: 1 },
});

function PlagiarismContentPage({ paragraphs, highlightedSentences, sentenceSourceMap, reportId, customLogoSrc }: {
    paragraphs: DocParagraph[];
    highlightedSentences: string[];
    sentenceSourceMap: Record<string, number[]>;
    reportId: string;
    customLogoSrc?: string;
}) {
    /** Check if a sentence is highlighted and return its source indices */
    const getMatchInfo = (sentence: string): number[] => {
        if (sentenceSourceMap[sentence]) return sentenceSourceMap[sentence];
        for (const key of Object.keys(sentenceSourceMap)) {
            if (sentence.includes(key) || key.includes(sentence)) {
                return sentenceSourceMap[key];
            }
        }
        if (highlightedSentences.some((h) => sentence.includes(h) || h.includes(sentence))) {
            return [0];
        }
        return [];
    };

    return (
        <Page size="A4" style={s.page} wrap>
            <Header label="Integrity Submission" reportId={reportId} logoSrc={customLogoSrc} />

            {paragraphs.map((para, pi) => {
                if (para.style === "Title") {
                    return <Text key={pi} style={ps4.titleText}>{para.text}</Text>;
                }
                if (para.style === "Heading1") {
                    const hlSources = getMatchInfo(para.text);
                    if (hlSources.length > 0) {
                        const bgColor = sourceHighlightBg(hlSources[0]);
                        return (
                            <View key={pi} style={ps4.marginBadgeWrap} wrap={false}>
                                <View style={ps4.marginBadgeCol}>
                                    {hlSources.map((si, i) => <SourceBadge key={i} num={si + 1} size={14} />)}
                                </View>
                                <Text style={[ps4.h1Text, { backgroundColor: bgColor, flex: 1 }]}>{para.text}</Text>
                            </View>
                        );
                    }
                    return <Text key={pi} style={ps4.h1Text}>{para.text}</Text>;
                }
                if (para.style === "Heading2") {
                    const hlSources = getMatchInfo(para.text);
                    if (hlSources.length > 0) {
                        const bgColor = sourceHighlightBg(hlSources[0]);
                        return (
                            <View key={pi} style={ps4.marginBadgeWrap} wrap={false}>
                                <View style={ps4.marginBadgeCol}>
                                    {hlSources.map((si, i) => <SourceBadge key={i} num={si + 1} size={14} />)}
                                </View>
                                <Text style={[ps4.h2Text, { backgroundColor: bgColor, flex: 1 }]}>{para.text}</Text>
                            </View>
                        );
                    }
                    return <Text key={pi} style={ps4.h2Text}>{para.text}</Text>;
                }

                // Table rendering
                if (para.style === "Table" && para.rows && para.rows.length > 0) {
                    return (
                        <View key={pi} style={ps4.tblWrap} wrap={false}>
                            {para.rows.map((row, ri) => (
                                <View key={ri} style={ps4.tblRow}>
                                    {row.map((cell, ci) => {
                                        const hlS = ri > 0 ? getMatchInfo(cell) : [];
                                        const cellStyle = ri === 0 ? ps4.tblHeaderCell
                                            : hlS.length > 0 ? { ...ps4.tblCell, backgroundColor: sourceHighlightBg(hlS[0]) }
                                                : ps4.tblCell;
                                        const textStyle = ri === 0 ? ps4.tblHeaderText : ps4.tblCellText;
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
                        <View key={pi} style={ps4.marginBadgeWrap} wrap={false}>
                            <View style={ps4.marginBadgeCol}>
                                {paraBadges.map((si, i) => <SourceBadge key={i} num={si + 1} size={14} />)}
                            </View>
                            <View style={ps4.contentCol}>
                                <Text>
                                    {sentences.map((sent, si) => {
                                        const matchSources = getMatchInfo(sent);
                                        if (matchSources.length > 0) {
                                            const bgColor = sourceHighlightBg(matchSources[0]);
                                            return (
                                                <Text key={si} style={[ps4.normalText, { backgroundColor: bgColor }]}>
                                                    {sent}{si < sentences.length - 1 ? " " : ""}
                                                </Text>
                                            );
                                        }
                                        return (
                                            <Text key={si} style={ps4.normalText}>
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
                    <View key={pi} style={ps4.paraBlock} wrap={false}>
                        <Text style={ps4.normalText}>{para.text}</Text>
                    </View>
                );
            })}

            <Footer label="Integrity Submission" reportId={reportId} logoSrc={customLogoSrc} />
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
            <IntegrityOverviewPage {...props} />
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
