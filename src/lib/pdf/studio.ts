import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { loadPdfDoc } from "@/lib/pdf/operations";

export type PageNumberPosition =
  | "bottom-center"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "top-right"
  | "top-left";

export type PageNumberFormat = "page-x-of-y" | "page-x" | "x-of-y" | "x-only";

export type PageNumberOptions = {
  enabled: boolean;
  position: PageNumberPosition;
  format: PageNumberFormat;
  fontSize: number;
  margin: number;
  skipFirstPage: boolean;
  startAt: number;
};

export type StudioPageItem = {
  id: string;
  originalIndex: number; // 0-based index in the source PDF
  rotation: number; // 0, 90, 180, 270
};

/**
 * Builds a transformed PDF with reordered/deleted pages, per-page rotations,
 * and optional dynamic page numbering.
 */
export async function buildStudioPdf(
  file: File,
  pages: StudioPageItem[],
  numbering?: PageNumberOptions,
): Promise<Uint8Array> {
  if (pages.length === 0) {
    throw new Error("EMPTY_PAGES");
  }

  const srcDoc = await loadPdfDoc(file);
  const outDoc = await PDFDocument.create();

  // 1. Copy pages according to the user's custom sequence
  const sourceIndices = pages.map((p) => p.originalIndex);
  const copiedPages = await outDoc.copyPages(srcDoc, sourceIndices);

  // 2. Add each page with its specific rotation
  copiedPages.forEach((copiedPage, i) => {
    const config = pages[i];
    const baseRotation = copiedPage.getRotation().angle;
    const finalRotation = (baseRotation + (config?.rotation || 0)) % 360;
    copiedPage.setRotation(degrees(finalRotation));
    outDoc.addPage(copiedPage);
  });

  // 3. Stamp page numbers if enabled
  if (numbering && numbering.enabled) {
    const font = await outDoc.embedFont(StandardFonts.Helvetica);
    const totalOutPages = outDoc.getPageCount();

    for (let i = 0; i < totalOutPages; i++) {
      // Check if first page should be skipped (e.g. cover page)
      if (i === 0 && numbering.skipFirstPage) {
        continue;
      }

      const page = outDoc.getPage(i);
      const { width, height } = page.getSize();
      const rotation = page.getRotation().angle;

      // Effective page numbering count
      const pageNum = numbering.skipFirstPage
        ? i + numbering.startAt - 1
        : i + numbering.startAt;
      const totalCount = numbering.skipFirstPage
        ? totalOutPages - 1
        : totalOutPages;

      let text = `${pageNum}`;
      switch (numbering.format) {
        case "page-x-of-y":
          text = `Sayfa ${pageNum} / ${totalCount}`;
          break;
        case "page-x":
          text = `Sayfa ${pageNum}`;
          break;
        case "x-of-y":
          text = `${pageNum} / ${totalCount}`;
          break;
        case "x-only":
        default:
          text = `${pageNum}`;
          break;
      }

      const textWidth = font.widthOfTextAtSize(text, numbering.fontSize);
      const textHeight = numbering.fontSize;

      // Calculate position considering unrotated coordinates
      let x = width / 2 - textWidth / 2;
      let y = numbering.margin;

      // For standard orientation (0 deg):
      if (numbering.position.startsWith("top-")) {
        y = height - numbering.margin - textHeight;
      } else {
        y = numbering.margin;
      }

      if (numbering.position.endsWith("-left")) {
        x = numbering.margin;
      } else if (numbering.position.endsWith("-right")) {
        x = width - numbering.margin - textWidth;
      } else {
        x = width / 2 - textWidth / 2;
      }

      page.drawText(text, {
        x,
        y,
        size: numbering.fontSize,
        font,
        color: rgb(0.2, 0.2, 0.2),
        rotate: degrees(rotation === 0 ? 0 : 0), // pdf-lib coordinates handles rotation
      });
    }
  }

  return outDoc.save({ useObjectStreams: true });
}
