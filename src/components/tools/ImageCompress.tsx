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

type Props = { labels: Dictionary["tools"]["imageCompress"] };

export default function ImageCompress({ labels }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.75);
  const [resultSize, setResultSize] = useState<number | null>(null);
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
    setResultSize(null);
    setFile(incoming);
    revokeUrl(preview);
    setPreview(URL.createObjectURL(incoming));
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const bmp = await loadImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
      const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await canvasToBlob(canvas, mime, mime === "image/jpeg" ? quality : undefined);
      setResultSize(blob.size);
      downloadBlob(blob, `compressed-${file.name.replace(/\.\w+$/, "")}.${mime === "image/png" ? "png" : "jpg"}`);
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
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="max-h-48 rounded-xl border border-slate-200 object-contain" />
      ) : null}
      <label className="block text-sm text-slate-600">
        {labels.quality}: {Math.round(quality * 100)}%
        <input type="range" min={0.3} max={0.95} step={0.05} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="mt-2 w-full" />
      </label>
      {resultSize != null ? (
        <p className="text-sm text-slate-600">{labels.resultSize}: {formatBytes(resultSize)}</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void run()} disabled={!file || busy} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40">
          {labels.download}
        </button>
        <button type="button" onClick={() => { setFile(null); revokeUrl(preview); setPreview(null); setResultSize(null); setError(""); }} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
