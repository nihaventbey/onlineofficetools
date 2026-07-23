import type { WmFontId, WmPosition, WatermarkOptions } from "./types";
import { WM_FONT_CSS } from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return { r: 100, g: 116, b: 139 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function positionAnchor(
  canvasW: number,
  canvasH: number,
  markW: number,
  markH: number,
  position: WmPosition,
  marginRatio = 0.04,
): { x: number; y: number } {
  const mx = canvasW * marginRatio;
  const my = canvasH * marginRatio;
  const col = position[1] === "l" ? 0 : position[1] === "c" ? 1 : 2;
  const row = position[0] === "t" ? 0 : position[0] === "m" ? 1 : 2;
  const xs = [mx, (canvasW - markW) / 2, canvasW - markW - mx];
  const ys = [my, (canvasH - markH) / 2, canvasH - markH - my];
  return { x: xs[col], y: ys[row] };
}

export type StampSource =
  | { kind: "text"; text: string; fontId: WmFontId; color: string }
  | { kind: "image"; bitmap: ImageBitmap };

/** Render a single watermark stamp to an offscreen canvas (opaque). */
export function renderStamp(
  source: StampSource,
  targetMinSide: number,
  scale: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const s = clamp(scale, 0.15, 3);

  if (source.kind === "text") {
    const fontSize = Math.max(12, Math.round(targetMinSide * 0.08 * s));
    const css = WM_FONT_CSS[source.fontId];
    ctx.font = `700 ${fontSize}px ${css}`;
    const metrics = ctx.measureText(source.text || " ");
    const pad = Math.ceil(fontSize * 0.35);
    const w = Math.ceil(metrics.width) + pad * 2;
    const h = Math.ceil(fontSize * 1.35) + pad * 2;
    canvas.width = Math.max(1, w);
    canvas.height = Math.max(1, h);
    ctx.font = `700 ${fontSize}px ${css}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    const { r, g, b } = parseHex(source.color);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillText(source.text || " ", w / 2, h / 2);
    return canvas;
  }

  const bmp = source.bitmap;
  const base = targetMinSide * 0.28 * s;
  const ratio = bmp.width / Math.max(1, bmp.height);
  let w = base;
  let h = base / ratio;
  if (ratio < 1) {
    h = base;
    w = base * ratio;
  }
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function drawStampAt(
  ctx: CanvasRenderingContext2D,
  stamp: HTMLCanvasElement,
  cx: number,
  cy: number,
  rotationDeg: number,
  opacity: number,
) {
  ctx.save();
  ctx.globalAlpha = clamp(opacity, 0.05, 1);
  ctx.translate(cx, cy);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.drawImage(stamp, -stamp.width / 2, -stamp.height / 2);
  ctx.restore();
}

/** Draw watermark onto an existing canvas (in place). */
export function applyWatermarkToCanvas(
  canvas: HTMLCanvasElement,
  options: WatermarkOptions,
  stampSource: StampSource,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const minSide = Math.min(canvas.width, canvas.height);
  const stamp = renderStamp(stampSource, minSide, options.scale);

  if (options.tile) {
    const gap = minSide * clamp(options.tileGap, 0.05, 0.6);
    const stepX = stamp.width + gap;
    const stepY = stamp.height + gap;
    const startX = -stamp.width;
    const startY = -stamp.height;
    for (let y = startY; y < canvas.height + stamp.height; y += stepY) {
      for (let x = startX; x < canvas.width + stamp.width; x += stepX) {
        drawStampAt(
          ctx,
          stamp,
          x + stamp.width / 2,
          y + stamp.height / 2,
          options.rotation,
          options.opacity,
        );
      }
    }
    return;
  }

  const { x, y } = positionAnchor(
    canvas.width,
    canvas.height,
    stamp.width,
    stamp.height,
    options.position,
  );
  drawStampAt(
    ctx,
    stamp,
    x + stamp.width / 2,
    y + stamp.height / 2,
    options.rotation,
    options.opacity,
  );
}

export async function watermarkImageFile(
  file: File,
  options: WatermarkOptions,
  stampImage?: File | null,
): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bmp.close();
    throw new Error("canvas");
  }
  ctx.drawImage(bmp, 0, 0);
  bmp.close();

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
    applyWatermarkToCanvas(canvas, options, source);
  } finally {
    markBmp?.close();
  }

  const mime =
    file.type === "image/png"
      ? "image/png"
      : file.type === "image/webp"
        ? "image/webp"
        : "image/jpeg";
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))),
      mime,
      mime === "image/jpeg" ? 0.92 : undefined,
    );
  });
}
