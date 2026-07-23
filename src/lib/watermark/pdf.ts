import { type PDFImage, type PDFPage } from "pdf-lib";
import { loadPdfDoc } from "@/lib/pdf/operations";
import {
  positionAnchor,
  renderStamp,
  type StampSource,
} from "./draw";
import type { WatermarkOptions } from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Rotate stamp into a larger canvas with opacity baked in (PDF-friendly). */
function bakeRotatedStamp(
  stamp: HTMLCanvasElement,
  rotationDeg: number,
  opacity: number,
): HTMLCanvasElement {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = Math.max(1, Math.ceil(stamp.width * cos + stamp.height * sin));
  const h = Math.max(1, Math.ceil(stamp.width * sin + stamp.height * cos));
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.globalAlpha = clamp(opacity, 0.05, 1);
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rad);
  ctx.drawImage(stamp, -stamp.width / 2, -stamp.height / 2);
  return out;
}

async function canvasToPngBytes(
  canvas: HTMLCanvasElement,
): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob"))),
      "image/png",
    );
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function placementCenters(
  pageW: number,
  pageH: number,
  stampW: number,
  stampH: number,
  options: WatermarkOptions,
): { x: number; y: number }[] {
  if (options.tile) {
    const minSide = Math.min(pageW, pageH);
    const gap = minSide * clamp(options.tileGap, 0.05, 0.6);
    const stepX = stampW + gap;
    const stepY = stampH + gap;
    const centers: { x: number; y: number }[] = [];
    for (let y = -stampH; y < pageH + stampH; y += stepY) {
      for (let x = -stampW; x < pageW + stampW; x += stepX) {
        centers.push({ x: x + stampW / 2, y: y + stampH / 2 });
      }
    }
    return centers;
  }
  const { x, y } = positionAnchor(pageW, pageH, stampW, stampH, options.position);
  return [{ x: x + stampW / 2, y: y + stampH / 2 }];
}

function drawStampOnPage(
  page: PDFPage,
  image: PDFImage,
  stampW: number,
  stampH: number,
  options: WatermarkOptions,
) {
  const { width: pageW, height: pageH } = page.getSize();
  const centers = placementCenters(pageW, pageH, stampW, stampH, options);

  for (const c of centers) {
    // Canvas Y is top-down; PDF Y is bottom-up. Center stays the same in X;
    // convert center Y, then place bottom-left of stamp.
    const pdfCenterY = pageH - c.y;
    const x = c.x - stampW / 2;
    const y = pdfCenterY - stampH / 2;
    page.drawImage(image, {
      x,
      y,
      width: stampW,
      height: stampH,
      opacity: 1,
    });
  }
}

export async function watermarkPdf(
  file: File,
  options: WatermarkOptions,
  stampImage?: File | null,
): Promise<Uint8Array> {
  const doc = await loadPdfDoc(file);
  const pages = doc.getPages();
  if (!pages.length) throw new Error("EMPTY");

  let markBmp: ImageBitmap | null = null;
  try {
    let source: StampSource;
    if (options.mode === "image") {
      if (!stampImage) throw new Error("NO_STAMP");
      markBmp = await createImageBitmap(stampImage);
      source = { kind: "image", bitmap: markBmp };
    } else {
      source = {
        kind: "text",
        text: options.text.trim() || " ",
        fontId: options.fontId,
        color: options.color,
      };
    }

    const cache = new Map<
      string,
      { image: PDFImage; w: number; h: number }
    >();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const minSide = Math.min(width, height);
      const key = String(Math.round(minSide));

      let cached = cache.get(key);
      if (!cached) {
        const raw = renderStamp(source, minSide, options.scale);
        const baked = bakeRotatedStamp(raw, options.rotation, options.opacity);
        const bytes = await canvasToPngBytes(baked);
        const image = await doc.embedPng(bytes);
        cached = { image, w: baked.width, h: baked.height };
        cache.set(key, cached);
      }

      drawStampOnPage(page, cached.image, cached.w, cached.h, options);
    }
  } finally {
    markBmp?.close();
  }

  return doc.save({ useObjectStreams: true });
}
