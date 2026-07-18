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

type Props = { labels: Dictionary["tools"]["imageResize"] };

export default function ImageResize({ labels }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);
  const [percent, setPercent] = useState(100);
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
    const url = URL.createObjectURL(incoming);
    setPreview(url);
    const bmp = await loadImageBitmap(incoming);
    setOrigW(bmp.width);
    setOrigH(bmp.height);
    setWidth(bmp.width);
    setHeight(bmp.height);
    bmp.close();
  }

  function onWidthChange(w: number) {
    setWidth(w);
    if (keepRatio && origW) setHeight(Math.round((w / origW) * origH));
  }

  function onHeightChange(h: number) {
    setHeight(h);
    if (keepRatio && origH) setWidth(Math.round((h / origH) * origW));
  }

  function applyPercent(p: number) {
    setPercent(p);
    if (origW && origH) {
      setWidth(Math.round((origW * p) / 100));
      setHeight(Math.round((origH * p) / 100));
    }
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const bmp = await loadImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      bmp.close();
      const blob = await canvasToBlob(canvas, file.type.startsWith("image/") ? file.type : "image/png");
      downloadBlob(blob, `resized-${file.name.replace(/\.\w+$/, "")}.png`);
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm text-slate-600">
          {labels.width}
          <input type="number" min={1} value={width} onChange={(e) => onWidthChange(Number(e.target.value))} className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 px-3" />
        </label>
        <label className="text-sm text-slate-600">
          {labels.height}
          <input type="number" min={1} value={height} onChange={(e) => onHeightChange(Number(e.target.value))} className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 px-3" />
        </label>
        <label className="text-sm text-slate-600">
          {labels.percent}
          <input type="number" min={1} max={500} value={percent} onChange={(e) => applyPercent(Number(e.target.value))} className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 px-3" />
        </label>
        <label className="flex items-end gap-2 pb-3 text-sm text-slate-700">
          <input type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} />
          {labels.keepRatio}
        </label>
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
