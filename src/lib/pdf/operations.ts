import { PDFDocument, degrees, type PDFPage } from "pdf-lib";
import { imageFileToPngOrJpeg } from "@/lib/files/utils";
import { readFileBytes } from "@/lib/pdf/utils";

export async function loadPdfDoc(file: File): Promise<PDFDocument> {
  const bytes = await readFileBytes(file);
  try {
    return await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/encrypt|password/i.test(msg)) {
      throw new Error("ENCRYPTED");
    }
    throw e;
  }
}

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const file of files) {
    const doc = await loadPdfDoc(file);
    const pages = await out.copyPages(doc, doc.getPageIndices());
    for (const page of pages) out.addPage(page);
  }
  return out.save({ useObjectStreams: true });
}

export async function splitPdf(
  file: File,
  pageNumbers1Based: number[],
): Promise<Uint8Array> {
  const src = await loadPdfDoc(file);
  const out = await PDFDocument.create();
  const zeroBased = pageNumbers1Based.map((n) => n - 1);
  const pages = await out.copyPages(src, zeroBased);
  for (const page of pages) out.addPage(page);
  return out.save({ useObjectStreams: true });
}

export async function rotatePdf(
  file: File,
  angle: 90 | 180 | 270,
  pageNumbers1Based: number[] | "all",
): Promise<Uint8Array> {
  const doc = await loadPdfDoc(file);
  const indices =
    pageNumbers1Based === "all"
      ? doc.getPageIndices()
      : pageNumbers1Based.map((n) => n - 1);

  for (const i of indices) {
    const page: PDFPage = doc.getPage(i);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  }
  return doc.save({ useObjectStreams: true });
}

export async function imagesToPdf(
  files: File[],
  pageSize: "auto" | "a4",
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const A4 = { w: 595.28, h: 841.89 };

  for (const file of files) {
    const { bytes, kind } = await imageFileToPngOrJpeg(file);
    const image =
      kind === "png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

    let pageW: number;
    let pageH: number;
    if (pageSize === "a4") {
      pageW = A4.w;
      pageH = A4.h;
    } else {
      pageW = image.width;
      pageH = image.height;
    }

    const page = doc.addPage([pageW, pageH]);
    const scale = Math.min(pageW / image.width, pageH / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    page.drawImage(image, {
      x: (pageW - drawW) / 2,
      y: (pageH - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  }

  return doc.save({ useObjectStreams: true });
}
