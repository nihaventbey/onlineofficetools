import { PDFDocument } from "pdf-lib";
import { readFileBytes } from "@/lib/pdf/utils";

/**
 * Rasterize each PDF page with pdf.js, re-embed as JPEG at given quality.
 * Text becomes image (intentional trade-off for size).
 */
export async function compressPdf(
  file: File,
  quality: number,
  onProgress?: (pct: number) => void,
): Promise<Uint8Array> {
  const pdfjs = await import("pdfjs-dist");
  // Use CDN worker to avoid bundler worker path issues with Turbopack.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = await readFileBytes(file);
  const loadingTask = pdfjs.getDocument({ data: data.slice() });
  const pdf = await loadingTask.promise;
  const out = await PDFDocument.create();
  const pageCount = pdf.numPages;
  const q = Math.min(0.95, Math.max(0.3, quality));

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("CANVAS");

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    const jpegDataUrl = canvas.toDataURL("image/jpeg", q);
    const jpegBytes = dataUrlToBytes(jpegDataUrl);
    const image = await out.embedJpg(jpegBytes);
    const pdfPage = out.addPage([viewport.width, viewport.height]);
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });

    onProgress?.(Math.round((i / pageCount) * 100));
    canvas.width = 0;
    canvas.height = 0;
  }

  return out.save({ useObjectStreams: true });
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
