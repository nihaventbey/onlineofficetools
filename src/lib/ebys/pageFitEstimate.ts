/** A4 portrait usable writing area with ~1.5 cm margins (approx Belgenet body). */
const PAGE_WIDTH_MM = 210 - 30; // 180 mm
const PAGE_HEIGHT_MM = 297 - 30; // 267 mm
const MM_PER_INCH = 25.4;

export type FitFont = "times" | "arial";

export type PageFitInput = {
  html: string;
  font: FitFont;
  fontSizePt: number;
  /** Line height multiplier (e.g. 1.15). */
  lineHeight?: number;
};

export type PageFitResult = {
  estimatedHeightMm: number;
  pageHeightMm: number;
  fitsFirstPage: boolean;
  utilization: number;
  charCount: number;
  lineEstimate: number;
};

export function estimatePageFit(input: PageFitInput): PageFitResult {
  const lineHeight = input.lineHeight ?? 1.15;
  const plain = stripTags(input.html);
  const charCount = plain.replace(/\s+/g, " ").trim().length;

  // Average glyph width relative to em (Times denser than Arial).
  const avgCharEm = input.font === "times" ? 0.45 : 0.52;
  const fontMm = (input.fontSizePt * MM_PER_INCH) / 72;
  const lineMm = fontMm * lineHeight;
  const charsPerLine = Math.max(
    1,
    Math.floor(PAGE_WIDTH_MM / (fontMm * avgCharEm)),
  );

  // Paragraph breaks add blank lines
  const paraBreaks = (input.html.match(/<\/p>/gi) ?? []).length;
  const softBreaks = (input.html.match(/<br\s*\/?>/gi) ?? []).length;
  const contentChars = Math.max(charCount, 1);
  const wrappedLines = Math.ceil(contentChars / charsPerLine);
  const lineEstimate = wrappedLines + paraBreaks + softBreaks;
  const estimatedHeightMm = lineEstimate * lineMm + 20; // + footer/signature slack

  const utilization = estimatedHeightMm / PAGE_HEIGHT_MM;
  return {
    estimatedHeightMm,
    pageHeightMm: PAGE_HEIGHT_MM,
    fitsFirstPage: estimatedHeightMm <= PAGE_HEIGHT_MM,
    utilization,
    charCount,
    lineEstimate,
  };
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
