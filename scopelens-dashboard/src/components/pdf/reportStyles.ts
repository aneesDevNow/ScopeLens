import { StyleSheet } from "@react-pdf/renderer";

// ─── Types ───
export interface DocParagraph {
    style: "Title" | "Heading1" | "Heading2" | "Normal";
    text: string;
}

export interface ReportProps {
    authorName: string;
    fileName: string;
    fileSize: string;
    submissionDate: string;
    downloadDate: string;
    reportId: string;
    aiPercent: number;
    group1Percent: number;
    group2Percent: number;
    paragraphs: DocParagraph[];
    highlightedSentences: string[];
    totalWords: number;
    totalChars: number;
    totalPagesEst: number;
    customLogoSrc?: string;
}

// ─── Colors ───
export const C = {
    slate900: "#0F172A",
    slate800: "#1E293B",
    slate700: "#334155",
    slate500: "#64748B",
    slate400: "#94A3B8",
    slate200: "#E2E8F0",
    blue500: "#3B82F6",
    blue700: "#1D4ED8",
    blue200: "#BFDBFE",
    blue100: "#EFF6FF",
    teal500: "#14B8A6",
    teal700: "#0D9488",
    teal100: "#CCFBF1",
    purple600: "#9333EA",
    white: "#FFFFFF",
    dark: "#2D3436",
    tealBg: "#53C7DB",
    purpleBg: "#B07CF7",
};

// ─── Shared page margin ───
export const M = 50; // horizontal margin in pt

// ─── Shared styles ───
export const s = StyleSheet.create({
    page: {
        paddingTop: 55,
        paddingBottom: 45,
        paddingHorizontal: M,
        fontFamily: "Helvetica",
        fontSize: 9,
        color: C.slate700,
        position: "relative",
    },
    // Header
    hdr: {
        position: "absolute",
        top: 12,
        left: M,
        right: M,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: C.slate200,
    },
    hdrLeft: { flexDirection: "row", alignItems: "center" },
    hdrBrand: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.blue500, marginLeft: 6 },
    hdrInfo: { fontSize: 8, color: C.slate500, marginLeft: 25 },
    hdrId: { fontSize: 8, color: C.slate500 },
    // Footer
    ftr: {
        position: "absolute",
        bottom: 10,
        left: M,
        right: M,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    ftrLeft: { flexDirection: "row", alignItems: "center" },
    ftrBrand: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.blue500, marginLeft: 5 },
    ftrInfo: { fontSize: 7, color: C.slate500, marginLeft: 20 },
    ftrId: { fontSize: 7, color: C.slate500 },
    // Common
    sep: { borderBottomWidth: 0.5, borderBottomColor: C.slate200, marginVertical: 10 },
    row: { flexDirection: "row" as const },
});

export function shortId(id: string): string {
    return id.length > 20 ? id.substring(0, 20) + "..." : id;
}
