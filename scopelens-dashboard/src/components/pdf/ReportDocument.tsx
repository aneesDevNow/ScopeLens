import React from "react";
import {
    Document, Page, View, Text, Image, StyleSheet,
    Svg, Circle, Rect, Path, Ellipse, G, Line,
} from "@react-pdf/renderer";
import { ReportProps, C, M, s, shortId } from "./reportStyles";

/* ═══════════════════════════════════════════
   SVG Components
   ═══════════════════════════════════════════ */

const ScopeLensLogo = ({ size = 22 }: { size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="48" fill={C.blue500} />
        <Circle cx="50" cy="44" r="22" fill="none" stroke={C.white} strokeWidth="5" />
        <Circle cx="50" cy="44" r="15" fill="none" stroke={C.white} strokeWidth="3" />
        <Line x1="65" y1="60" x2="78" y2="75" stroke={C.white} strokeWidth="7" strokeLinecap="round" />
    </Svg>
);

const RobotIcon = ({ bg, size = 20 }: { bg: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 120 120">
        <Circle cx="60" cy="60" r="58" fill={bg} />
        <Circle cx="60" cy="16" r="7" fill={C.dark} />
        <Rect x="57.5" y="16" width="5" height="14" rx="2.5" fill={C.dark} />
        <Path
            d="M 26,46 Q 26,34 38,34 L 82,34 Q 94,34 94,46 L 94,51 Q 108,51 108,62 Q 108,73 94,73 L 94,94 Q 94,106 82,106 L 38,106 Q 26,106 26,94 L 26,73 Q 12,73 12,62 Q 12,51 26,51 Z"
            fill={C.dark}
        />
        <Ellipse cx="47" cy="58" rx="9" ry="9" fill={bg} />
        <Ellipse cx="73" cy="58" rx="9" ry="9" fill={bg} />
        <Rect x="40" y="82" width="40" height="9" rx="4.5" fill={bg} />
    </Svg>
);

/* ═══════════════════════════════════════════
   Shared Header / Footer
   ═══════════════════════════════════════════ */

const Header = ({ label, reportId, logoSrc }: { label: string; reportId: string; logoSrc?: string }) => (
    <View style={s.hdr} fixed>
        <View style={s.hdrLeft}>
            {logoSrc ? (
                <Image src={logoSrc} style={{ width: 22, height: 22 }} />
            ) : (
                <ScopeLensLogo size={22} />
            )}
            <Text style={s.hdrBrand}>ScopeLens</Text>
            <Text style={s.hdrInfo} render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages} · ${label}`
            } />
        </View>
        <Text style={s.hdrId}>Report ID   {shortId(reportId)}</Text>
    </View>
);

const Footer = ({ label, reportId, logoSrc }: { label: string; reportId: string; logoSrc?: string }) => (
    <View style={s.ftr} fixed>
        <View style={s.ftrLeft}>
            {logoSrc ? (
                <Image src={logoSrc} style={{ width: 18, height: 18 }} />
            ) : (
                <ScopeLensLogo size={18} />
            )}
            <Text style={s.ftrBrand}>ScopeLens</Text>
            <Text style={s.ftrInfo} render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages} · ${label}`
            } />
        </View>
        <Text style={s.ftrId}>Report ID   {shortId(reportId)}</Text>
    </View>
);

/* ═══════════════════════════════════════════
   PAGE 1: Cover Page
   ═══════════════════════════════════════════ */

const ps1 = StyleSheet.create({
    authorName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#181818", marginTop: 150 },
    fileName: { fontSize: 17, fontFamily: "Helvetica", color: "#181818", marginTop: 10 },
    brandRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
    brandText: { fontSize: 8, color: "#626262", marginLeft: 6 },
    detailsTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#181818", marginTop: 8, marginBottom: 10 },
    detailsRow: { flexDirection: "row", justifyContent: "space-between" },
    detailsLeft: { flex: 1 },
    detailRow: { marginBottom: 12 },
    detailLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#626262", marginBottom: 2 },
    detailValue: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#181818" },
    statsCol: { width: 110, alignItems: "flex-end", paddingTop: 0 },
    statBox: { borderWidth: 0.3, borderColor: C.slate200, paddingVertical: 6, paddingHorizontal: 12, alignItems: "center", width: 110 },
    statText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#181818" },
});

const CoverPage = (p: ReportProps) => (
    <Page size="A4" style={s.page}>
        <Header label="Cover Page" reportId={p.reportId} logoSrc={p.customLogoSrc} />

        <Text style={ps1.authorName}>{p.authorName}</Text>
        <Text style={ps1.fileName}>{p.fileName}</Text>

        <View style={ps1.brandRow}>
            <ScopeLensLogo size={16} />
            <Text style={ps1.brandText}>ScopeLens</Text>
        </View>

        <View style={s.sep} />

        {/* Document Details (left) + Stats (right) — side by side */}
        <View style={ps1.detailsRow}>
            <View style={ps1.detailsLeft}>
                <Text style={ps1.detailsTitle}>Document Details</Text>

                {([
                    ["Report ID", p.reportId],
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

            {/* Stats boxes (right side, aligned with details top) */}
            <View style={ps1.statsCol}>
                {[
                    `${p.totalPagesEst} Pages`,
                    `${p.totalWords.toLocaleString()} Words`,
                    `${p.totalChars.toLocaleString()} Characters`,
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

/* ═══════════════════════════════════════════
   PAGE 2: AI Writing Overview
   ═══════════════════════════════════════════ */

const ps2 = StyleSheet.create({
    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    pctText: { fontSize: 17, fontFamily: "Helvetica", color: "#181818" },
    pctDesc: { fontSize: 7, color: "#181818", marginTop: 6, maxWidth: 280 },
    cautionBox: {
        backgroundColor: C.blue100, borderWidth: 0.5, borderColor: C.blue200,
        borderRadius: 3, padding: 10, width: 210,
    },
    cautionTitle: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.blue700, marginBottom: 4 },
    cautionText: { fontSize: 6, color: C.blue500, lineHeight: 1.4 },
    sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#181818", marginBottom: 10 },
    groupRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
    groupIcon: { width: 20, height: 20 },
    groupLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#181818", marginLeft: 8 },
    groupDesc: { fontSize: 7, color: "#626262", marginLeft: 28, marginBottom: 10 },
    disclaimerTitle: { fontSize: 6, fontFamily: "Helvetica-Bold", color: "#626262", marginBottom: 4 },
    disclaimerText: { fontSize: 6, color: "#626262", lineHeight: 1.1 },
    faqTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#181818", marginBottom: 10 },
    faqQ: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#181818", marginBottom: 4 },
    faqA: { fontSize: 7, color: "#181818", lineHeight: 1.5, marginBottom: 6 },
    faqRow: { flexDirection: "row" },
    faqLeft: { flex: 1 },
    faqImage: { width: 100, height: 120, marginLeft: 10, marginTop: 10 },
});

const AIOverviewPage = (p: ReportProps) => {
    const displayPct = p.aiPercent < 20 && p.aiPercent > 0 ? "*" : `${p.aiPercent}`;

    return (
        <Page size="A4" style={s.page}>
            <Header label="AI Writing Overview" reportId={p.reportId} logoSrc={p.customLogoSrc} />

            {/* ── Percentage + Caution box ── */}
            <View style={ps2.topRow}>
                <View>
                    <Text style={ps2.pctText}>{displayPct}% detected as AI</Text>
                    <Text style={ps2.pctDesc}>
                        The percentage indicates the combined amount of likely AI-generated text as
                        well as likely AI-generated text that was also likely AI-paraphrased.
                    </Text>
                </View>
                <View style={ps2.cautionBox}>
                    <Text style={ps2.cautionTitle}>Caution: Review required.</Text>
                    <Text style={ps2.cautionText}>
                        It is essential to understand the limitations of AI detection before making decisions
                        about a student&apos;s work. We encourage you to learn more about ScopeLens&apos;s AI
                        writing detection capabilities before using the tool.
                    </Text>
                </View>
            </View>

            <View style={[s.sep, { marginTop: 16 }]} />

            {/* ── Detection Groups ── */}
            <Text style={ps2.sectionTitle}>Detection Groups</Text>

            {/* Group 1: AI-generated */}
            <View style={ps2.groupRow}>
                {p.robotTealSrc ? (
                    <Image src={p.robotTealSrc} style={ps2.groupIcon} />
                ) : (
                    <RobotIcon bg={C.tealBg} size={20} />
                )}
                <Text style={ps2.groupLabel}>AI-generated only  {p.group1Percent}%</Text>
            </View>
            <Text style={ps2.groupDesc}>Likely AI-generated text from a large-language model.</Text>

            {/* Group 2: AI-paraphrased */}
            <View style={ps2.groupRow}>
                {p.robotPurpleSrc ? (
                    <Image src={p.robotPurpleSrc} style={ps2.groupIcon} />
                ) : (
                    <RobotIcon bg={C.purpleBg} size={20} />
                )}
                <Text style={ps2.groupLabel}>AI-generated text that was AI-paraphrased  {p.group2Percent}%</Text>
            </View>
            <Text style={ps2.groupDesc}>
                Likely AI-generated text that was likely revised using an AI-paraphrase tool or word spinner.
            </Text>

            <View style={[s.sep, { marginTop: 8 }]} />

            {/* ── Disclaimer ── */}
            <Text style={ps2.disclaimerTitle}>Disclaimer</Text>
            <Text style={ps2.disclaimerText}>
                Our AI writing assessment is designed to help educators identify text that might be prepared
                by a generative AI tool. Our AI writing assessment may not always be accurate (it may misidentify
                writing that is likely AI generated as AI generated and AI paraphrased or likely AI generated
                and AI paraphrased writing as only AI generated) so it should not be used as the sole basis
                for adverse actions against a student. It takes further scrutiny and human judgment in
                conjunction with an organization&apos;s application of its specific academic policies to determine
                whether any academic misconduct has occurred.
            </Text>

            <View style={[s.sep, { marginTop: 10 }]} />

            {/* ── FAQ with illustration ── */}
            <View style={ps2.faqRow}>
                <View style={ps2.faqLeft}>
                    <Text style={ps2.faqTitle}>Frequently Asked Questions</Text>

                    <Text style={ps2.faqQ}>
                        How should I interpret ScopeLens&apos;s AI writing percentage and false positives?
                    </Text>
                    <Text style={ps2.faqA}>
                        The percentage shown in the AI writing report is the amount of qualifying text within
                        the submission that ScopeLens&apos;s AI writing detection model determines was either likely
                        AI-generated text from a large-language model or likely AI-generated text that was likely
                        revised using an AI paraphrase tool or word spinner.
                    </Text>
                    <Text style={ps2.faqA}>
                        False positives (incorrectly flagging human-written text as AI-generated) are a possibility in AI models.
                    </Text>
                    <Text style={ps2.faqA}>
                        AI detection scores under 20%, which we do not surface in new reports, have a higher
                        likelihood of false positives. To reduce the likelihood of misinterpretation, no score or
                        highlights are attributed and are indicated with an asterisk in the report (*%).
                    </Text>
                    <Text style={ps2.faqA}>
                        The AI writing percentage should not be the sole basis to determine whether misconduct has
                        occurred. The reviewer/instructor should use the percentage as a means to start a formative
                        conversation with their student and/or use it to examine the submitted assignment in
                        accordance with their school&apos;s policies.
                    </Text>

                    <Text style={[ps2.faqQ, { marginTop: 6 }]}>What does &apos;qualifying text&apos; mean?</Text>
                    <Text style={ps2.faqA}>
                        Our model only processes qualifying text in the form of long-form writing. Long-form writing
                        means individual sentences contained in paragraphs that make up a longer piece of written
                        work, such as an essay, a dissertation, or an article, etc. Qualifying text that has been
                        determined to be likely AI-generated will be highlighted in cyan in the submission, and
                        likely AI-generated and then likely AI-paraphrased will be highlighted purple.
                    </Text>
                    <Text style={ps2.faqA}>
                        Non-qualifying text, such as bullet points, annotated bibliographies, etc., will not be
                        processed and can create disparity between the submission highlights and the percentage shown.
                    </Text>
                </View>

                {/* FAQ Illustration (right side) */}
                {p.faqImageSrc && (
                    <Image src={p.faqImageSrc} style={ps2.faqImage} />
                )}
            </View>

            <Footer label="AI Writing Overview" reportId={p.reportId} logoSrc={p.customLogoSrc} />
        </Page>
    );
};

/* ═══════════════════════════════════════════
   PAGES 3+: Document Content with Highlights
   ═══════════════════════════════════════════ */

const ps3 = StyleSheet.create({
    titleText: { fontSize: 20, fontFamily: "Times-Bold", color: "#181818", marginTop: 8, marginBottom: 4 },
    h1Text: { fontSize: 17, fontFamily: "Times-Bold", color: "#181818", marginTop: 8, marginBottom: 3 },
    h2Text: { fontSize: 14, fontFamily: "Times-Bold", color: "#181818", marginTop: 6, marginBottom: 2 },
    paraBlock: { marginBottom: 6 },
    normalText: { fontSize: 12, fontFamily: "Times-Roman", color: "#181818", lineHeight: 1.6, textAlign: "justify" },
    hlText: { fontSize: 12, fontFamily: "Times-Roman", color: "#181818", backgroundColor: "#CCFBF1", lineHeight: 1.6, textAlign: "justify" },
    hlTextPurple: { fontSize: 12, fontFamily: "Times-Roman", color: "#181818", backgroundColor: "#EDE9FE", lineHeight: 1.6, textAlign: "justify" },
    // Table styles
    tblWrap: { marginVertical: 8, borderWidth: 0.5, borderColor: "#D1D5DB" },
    tblRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#D1D5DB" },
    tblHeaderCell: { flex: 1, padding: 5, backgroundColor: "#F3F4F6", borderRightWidth: 0.5, borderRightColor: "#D1D5DB" },
    tblCell: { flex: 1, padding: 5, borderRightWidth: 0.5, borderRightColor: "#D1D5DB" },
    tblHeaderText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#181818" },
    tblCellText: { fontSize: 9, fontFamily: "Times-Roman", color: "#181818" },
});

const ContentPage = ({ paragraphs, highlightedSentences, group1Percent, group2Percent, reportId, customLogoSrc }: {
    paragraphs: ReportProps["paragraphs"];
    highlightedSentences: string[];
    group1Percent: number;
    group2Percent: number;
    reportId: string;
    customLogoSrc?: string;
}) => {
    const isHighlighted = (sentence: string) =>
        highlightedSentences.some((h) => sentence.includes(h) || h.includes(sentence));

    // Split highlighted sentences proportionally: group1 (teal) vs group2 (purple)
    const totalPct = group1Percent + group2Percent;
    const group1Ratio = totalPct > 0 ? group1Percent / totalPct : 1;
    // Count total highlighted sentences
    let totalHl = 0;
    for (const para of paragraphs) {
        if (para.style === "Normal") {
            for (const sent of para.text.split(/(?<=[.!?])\s+/)) {
                if (isHighlighted(sent)) totalHl++;
            }
        }
    }
    const group1Count = Math.round(totalHl * group1Ratio);
    let hlSeen = 0;

    return (
        <Page size="A4" style={s.page} wrap>
            <Header label="AI Writing Submission" reportId={reportId} logoSrc={customLogoSrc} />

            {paragraphs.map((para, pi) => {
                if (para.style === "Title") {
                    return <Text key={pi} style={ps3.titleText}>{para.text}</Text>;
                }
                if (para.style === "Heading1") {
                    return <Text key={pi} style={ps3.h1Text}>{para.text}</Text>;
                }
                if (para.style === "Heading2") {
                    return <Text key={pi} style={ps3.h2Text}>{para.text}</Text>;
                }

                // ─── Table rendering ───
                if (para.style === "Table" && para.rows && para.rows.length > 0) {
                    return (
                        <View key={pi} style={ps3.tblWrap} wrap={false}>
                            {para.rows.map((row, ri) => (
                                <View key={ri} style={ps3.tblRow}>
                                    {row.map((cell, ci) => (
                                        <View key={ci} style={ri === 0 ? ps3.tblHeaderCell : ps3.tblCell}>
                                            <Text style={ri === 0 ? ps3.tblHeaderText : ps3.tblCellText}>
                                                {cell}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    );
                }

                // Normal paragraph — split into sentences for highlighting
                const sentences = para.text.split(/(?<=[.!?])\s+/);

                return (
                    <View key={pi} style={ps3.paraBlock} wrap={false}>
                        <Text>
                            {sentences.map((sent, si) => {
                                const hl = isHighlighted(sent);
                                let style = ps3.normalText;
                                if (hl) {
                                    hlSeen++;
                                    // First N highlights = teal (group1), rest = purple (group2)
                                    style = hlSeen <= group1Count ? ps3.hlText : ps3.hlTextPurple;
                                }
                                return (
                                    <Text key={si} style={style}>
                                        {sent}{si < sentences.length - 1 ? " " : ""}
                                    </Text>
                                );
                            })}
                        </Text>
                    </View>
                );
            })}

            <Footer label="AI Writing Submission" reportId={reportId} logoSrc={customLogoSrc} />
        </Page>
    );
};

/* ═══════════════════════════════════════════
   Main Document
   ═══════════════════════════════════════════ */

const ReportDocument = (props: ReportProps) => (
    <Document
        title={`AI Report - ${props.fileName}`}
        author="ScopeLens"
        subject="AI Writing Detection Report"
    >
        <CoverPage {...props} />
        <AIOverviewPage {...props} />
        {props.paragraphs.length > 0 && (
            <ContentPage
                paragraphs={props.paragraphs}
                highlightedSentences={props.highlightedSentences}
                group1Percent={props.group1Percent}
                group2Percent={props.group2Percent}
                reportId={props.reportId}
                customLogoSrc={props.customLogoSrc}
            />
        )}
    </Document>
);

export default ReportDocument;
export { ReportDocument };
