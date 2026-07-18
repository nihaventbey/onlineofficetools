"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import {
  canvasToBlob,
  downloadBlob,
  formatBytes,
  isImageFile,
  loadImageBitmap,
  MAX_IMAGE_BYTES,
  revokeUrl,
} from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["imageEnhance"] };

function sharpen(imageData: ImageData, amount: number): ImageData {
  const { data, width, height } = imageData;
  const out = new Uint8ClampedArray(data);
  const kernel = [0, -1, 0, -1, 4 + amount, -1, 0, -1, 0];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx]! * kernel[ki]!;
            ki++;
          }
        }
        const oi = (y * width + x) * 4 + c;
        out[oi] = Math.min(255, Math.max(0, data[oi]! + sum * 0.25));
      }
    }
  }
  return new ImageData(out, width, height);
}

function adjustContrast(imageData: ImageData, contrast: number): ImageData {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const out = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < out.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      out[i + c] = Math.min(255, Math.max(0, factor * (out[i + c]! - 128) + 128));
    }
  }
  return new ImageData(out, imageData.width, imageData.height);
}

export default function ImageEnhance({ labels }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [scale, setScale] = useState<2 | 4>(2);
  const [sharpenOn, setSharpenOn] = useState(true);
  const [contrast, setContrast] = useState(20);
  const [showCompare, setShowCompare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    revokeUrl(before);
    revokeUrl(after);
  }, [before, after]);

  async function onFile(incoming: File) {
    if (!isImageFile(incoming)) {
      setError(labels.invalidFile);
      return;
    }
    if (incoming.size > MAX_IMAGE_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    setError("");
    setFile(incoming);
    revokeUrl(before);
    revokeUrl(after);
    setBefore(URL.createObjectURL(incoming));
    setAfter(null);
    setShowCompare(false);
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const bmp = await loadImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width * scale;
      canvas.height = bmp.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      bmp.close();

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (sharpenOn) imageData = sharpen(imageData, 1);
      if (contrast !== 0) imageData = adjustContrast(imageData, contrast);
      ctx.putImageData(imageData, 0, 0);

      revokeUrl(after);
      setAfter(canvas.toDataURL("image/png"));
      setShowCompare(true);

      const blob = await canvasToBlob(canvas, "image/png");
      downloadBlob(blob, `enhanced-${scale}x.png`);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <FileDropZone accept="image/*" dropHint={labels.dropHint} selectHint={labels.selectHint ?? ""} onFiles={(f) => void onFile(f[0])} disabled={busy} />
      {file ? <p className="text-sm text-slate-600">{file.name} · {formatBytes(file.size)}</p> : null}
      <div className="flex flex-wrap gap-2">
        {([2, 4] as const).map((s) => (
          <button key={s} type="button" onClick={() => setScale(s)} className={`min-h-11 rounded-xl px-4 text-sm font-medium ${scale === s ? "bg-blue-600 text-white" : "border border-slate-200"}`}>
            {labels.scale} {s}×
          </button>
        ))}
        <button type="button" onClick={() => setSharpenOn((v) => !v)} className={`min-h-11 rounded-xl px-4 text-sm font-medium ${sharpenOn ? "bg-blue-600 text-white" : "border border-slate-200"}`}>
          {labels.sharpen}
        </button>
      </div>
      <label className="block text-sm text-slate-600">
        {labels.contrast}: {contrast}
        <input type="range" min={-50} max={80} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="mt-2 w-full" />
      </label>
      {showCompare && before && after ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{labels.before}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={before} alt="" className="max-h-48 w-full rounded-xl border border-slate-200 object-contain" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{labels.after}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={after} alt="" className="max-h-48 w-full rounded-xl border border-slate-200 object-contain" />
          </div>
        </div>
      ) : before ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={before} alt="" className="max-h-48 rounded-xl border border-slate-200 object-contain" />
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void run()} disabled={!file || busy} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40">
          {labels.download}
        </button>
        <button type="button" onClick={() => { setFile(null); revokeUrl(before); revokeUrl(after); setBefore(null); setAfter(null); setShowCompare(false); setError(""); }} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
