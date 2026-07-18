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

type Props = { labels: Dictionary["tools"]["imageCrop"] };

export default function ImageCrop({ labels }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [cropW, setCropW] = useState(400);
  const [cropH, setCropH] = useState(400);
  const [rotate, setRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => revokeUrl(preview), [preview]);

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
    revokeUrl(preview);
    setPreview(URL.createObjectURL(incoming));
    const bmp = await loadImageBitmap(incoming);
    setOrigW(bmp.width);
    setOrigH(bmp.height);
    setCropW(Math.min(bmp.width, 400));
    setCropH(Math.min(bmp.height, 400));
    bmp.close();
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const bmp = await loadImageBitmap(file);
      const cw = Math.min(cropW, bmp.width);
      const ch = Math.min(cropH, bmp.height);
      const sx = Math.max(0, Math.floor((bmp.width - cw) / 2));
      const sy = Math.max(0, Math.floor((bmp.height - ch) / 2));

      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(bmp, sx, sy, cw, ch, -cw / 2, -ch / 2, cw, ch);
      bmp.close();

      const blob = await canvasToBlob(canvas, "image/png");
      downloadBlob(blob, `cropped-${file.name.replace(/\.\w+$/, "")}.png`);
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
      {file ? <p className="text-sm text-slate-600">{file.name} · {formatBytes(file.size)} · {origW}×{origH}</p> : null}
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="max-h-48 rounded-xl border border-slate-200 object-contain" />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-600">
          Crop W
          <input type="number" min={1} max={origW || 9999} value={cropW} onChange={(e) => setCropW(Number(e.target.value))} className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 px-3" />
        </label>
        <label className="text-sm text-slate-600">
          Crop H
          <input type="number" min={1} max={origH || 9999} value={cropH} onChange={(e) => setCropH(Number(e.target.value))} className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 px-3" />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setRotate((r) => (r + 90) % 360)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.rotate} ({rotate}°)
        </button>
        <button type="button" onClick={() => setFlipH((v) => !v)} className={`min-h-11 rounded-xl px-4 text-sm font-medium ${flipH ? "bg-blue-600 text-white" : "border border-slate-200"}`}>
          {labels.flipH}
        </button>
        <button type="button" onClick={() => setFlipV((v) => !v)} className={`min-h-11 rounded-xl px-4 text-sm font-medium ${flipV ? "bg-blue-600 text-white" : "border border-slate-200"}`}>
          {labels.flipV}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void run()} disabled={!file || busy} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40">
          {labels.download}
        </button>
        <button type="button" onClick={() => { setFile(null); revokeUrl(preview); setPreview(null); setError(""); }} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
