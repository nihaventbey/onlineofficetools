"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";
import {
  downloadBlob,
  formatBytes,
  isImageFile,
  MAX_IMAGE_BYTES,
  revokeUrl,
} from "@/lib/files/utils";
import { isPdfFile } from "@/lib/pdf/utils";
import { validatePdfSize, FileDropZone } from "@/components/tools/pdf/PdfUi";
import {
  applyWatermarkToCanvas,
  watermarkImageFile,
  type StampSource,
} from "@/lib/watermark/draw";
import { watermarkPdf } from "@/lib/watermark/pdf";
import {
  DEFAULT_WATERMARK,
  WM_FONT_CSS,
  WM_POSITIONS,
  type WatermarkOptions,
  type WmFontId,
  type WmPosition,
} from "@/lib/watermark/types";

type Props = { labels: Dictionary["tools"]["watermark"] };

type Draft = Omit<WatermarkOptions, "mode"> & {
  mode: WatermarkOptions["mode"];
};

const FONTS: WmFontId[] = [
  "arial",
  "helvetica",
  "times",
  "georgia",
  "courier",
  "verdana",
  "impact",
  "trebuchet",
];

const FONT_LABEL: Record<WmFontId, string> = {
  arial: "Arial",
  helvetica: "Helvetica",
  times: "Times New Roman",
  georgia: "Georgia",
  courier: "Courier New",
  verdana: "Verdana",
  impact: "Impact",
  trebuchet: "Trebuchet MS",
};

function extOf(name: string, fallback: string) {
  const m = name.match(/\.(\w+)$/);
  return m ? m[1].toLowerCase() : fallback;
}

export default function Watermark({ labels }: Props) {
  const [draft, setDraft, clearDraft] = useToolDraft<Draft>("watermark", {
    ...DEFAULT_WATERMARK,
    text: labels.defaultText,
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileKind, setFileKind] = useState<"image" | "pdf" | null>(null);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceBmpRef = useRef<ImageBitmap | null>(null);
  const stampBmpRef = useRef<ImageBitmap | null>(null);
  const [previewTick, setPreviewTick] = useState(0);

  useEffect(() => {
    return () => {
      revokeUrl(previewUrl);
      sourceBmpRef.current?.close();
      stampBmpRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSourceFiles(incoming: File[]) {
    const f = incoming[0];
    if (!f) return;
    setError("");
    if (isPdfFile(f)) {
      if (validatePdfSize(f) !== "ok") {
        setError(labels.tooLarge);
        return;
      }
      sourceBmpRef.current?.close();
      sourceBmpRef.current = null;
      setFile(f);
      setFileKind("pdf");
      revokeUrl(previewUrl);
      setPreviewUrl(null);
      setPreviewTick((n) => n + 1);
      return;
    }
    if (!isImageFile(f)) {
      setError(labels.invalidFile);
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    try {
      const bmp = await createImageBitmap(f);
      sourceBmpRef.current?.close();
      sourceBmpRef.current = bmp;
      setFile(f);
      setFileKind("image");
      revokeUrl(previewUrl);
      setPreviewUrl(URL.createObjectURL(f));
      setPreviewTick((n) => n + 1);
    } catch {
      setError(labels.error);
    }
  }

  async function onStampFiles(incoming: File[]) {
    const f = incoming[0];
    if (!f) return;
    if (!isImageFile(f)) {
      setError(labels.invalidStamp);
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    try {
      const bmp = await createImageBitmap(f);
      stampBmpRef.current?.close();
      stampBmpRef.current = bmp;
      setStampFile(f);
      setError("");
      setPreviewTick((n) => n + 1);
    } catch {
      setError(labels.invalidStamp);
    }
  }

  const options: WatermarkOptions = useMemo(
    () => ({
      mode: draft.mode,
      text: draft.text,
      fontId: draft.fontId,
      color: draft.color,
      position: draft.position,
      opacity: draft.opacity,
      rotation: draft.rotation,
      scale: draft.scale,
      tile: draft.tile,
      tileGap: draft.tileGap,
    }),
    [draft],
  );

  // Live preview
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const maxW = 640;
    const maxH = 480;

    let srcW = 595;
    let srcH = 842;
    const bmp = sourceBmpRef.current;
    if (fileKind === "image" && bmp) {
      srcW = bmp.width;
      srcH = bmp.height;
    }

    const fit = Math.min(maxW / srcW, maxH / srcH, 1);
    const w = Math.max(1, Math.round(srcW * fit));
    const h = Math.max(1, Math.round(srcH * fit));
    canvas.width = w;
    canvas.height = h;

    // Checkerboard backdrop
    const size = 12;
    for (let y = 0; y < h; y += size) {
      for (let x = 0; x < w; x += size) {
        const odd = ((x / size) | 0) + ((y / size) | 0);
        ctx.fillStyle = odd % 2 === 0 ? "#f1f5f9" : "#e2e8f0";
        ctx.fillRect(x, y, size, size);
      }
    }

    if (fileKind === "image" && bmp) {
      ctx.drawImage(bmp, 0, 0, w, h);
    } else if (fileKind === "pdf") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#cbd5e1";
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(labels.pdfPreviewHint, w / 2, h / 2);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(labels.previewEmpty, w / 2, h / 2);
      return;
    }

    try {
      let source: StampSource;
      if (options.mode === "image") {
        if (!stampBmpRef.current) return;
        source = { kind: "image", bitmap: stampBmpRef.current };
      } else {
        source = {
          kind: "text",
          text: options.text.trim() || labels.defaultText,
          fontId: options.fontId,
          color: options.color,
        };
      }
      applyWatermarkToCanvas(canvas, options, source);
    } catch {
      // Preview failures are non-fatal
    }
  }, [options, fileKind, previewTick, labels.defaultText, labels.pdfPreviewHint, labels.previewEmpty]);

  async function run() {
    if (!file || !fileKind) return;
    if (draft.mode === "text" && !draft.text.trim()) {
      setError(labels.emptyText);
      return;
    }
    if (draft.mode === "image" && !stampFile) {
      setError(labels.needStamp);
      return;
    }
    setBusy(true);
    setProgress(20);
    setError("");
    try {
      if (fileKind === "image") {
        setProgress(50);
        const blob = await watermarkImageFile(file, options, stampFile);
        setProgress(100);
        const base = file.name.replace(/\.\w+$/, "");
        downloadBlob(blob, `${base}-watermarked.${extOf(file.name, "jpg")}`);
      } else {
        setProgress(40);
        const bytes = await watermarkPdf(file, options, stampFile);
        setProgress(100);
        const copy = new Uint8Array(bytes);
        downloadBlob(
          new Blob([copy], { type: "application/pdf" }),
          `${file.name.replace(/\.pdf$/i, "")}-watermarked.pdf`,
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "ENCRYPTED") setError(labels.encrypted);
      else if (msg === "NO_STAMP") setError(labels.needStamp);
      else setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  function resetAll() {
    clearDraft();
    setFile(null);
    setFileKind(null);
    setStampFile(null);
    sourceBmpRef.current?.close();
    sourceBmpRef.current = null;
    stampBmpRef.current?.close();
    stampBmpRef.current = null;
    revokeUrl(previewUrl);
    setPreviewUrl(null);
    setError("");
    setProgress(0);
    setPreviewTick((n) => n + 1);
  }

  function setPos(position: WmPosition) {
    setDraft({ ...draft, position, tile: false });
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">{labels.preview}</h3>
            {file ? (
              <span className="truncate text-xs text-slate-500">
                {file.name} · {formatBytes(file.size)}
                {fileKind === "pdf" ? ` · ${labels.kindPdf}` : ` · ${labels.kindImage}`}
              </span>
            ) : null}
          </div>
          <div className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-3">
            <canvas
              ref={previewCanvasRef}
              className="max-h-[480px] max-w-full rounded-lg shadow-sm"
              aria-label={labels.preview}
            />
          </div>
          <FileDropZone
            accept="image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.webp"
            dropHint={labels.dropHint}
            selectHint={labels.selectHint}
            onFiles={(f) => void onSourceFiles(f)}
            disabled={busy}
          />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Mode */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">{labels.mode}</p>
            <div className="grid grid-cols-2 gap-2">
              {(["text", "image"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDraft({ ...draft, mode })}
                  className={`min-h-11 rounded-xl text-sm font-medium transition ${
                    draft.mode === mode
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {mode === "text" ? labels.modeText : labels.modeImage}
                </button>
              ))}
            </div>
          </div>

          {draft.mode === "text" ? (
            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">{labels.textLabel}</span>
                <input
                  type="text"
                  value={draft.text}
                  onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                  placeholder={labels.textPlaceholder}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">{labels.fontLabel}</span>
                <select
                  value={draft.fontId}
                  onChange={(e) =>
                    setDraft({ ...draft, fontId: e.target.value as WmFontId })
                  }
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                  style={{ fontFamily: WM_FONT_CSS[draft.fontId] }}
                >
                  {FONTS.map((id) => (
                    <option key={id} value={id} style={{ fontFamily: WM_FONT_CSS[id] }}>
                      {FONT_LABEL[id]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">{labels.colorLabel}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft.color}
                    onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                  />
                  <input
                    type="text"
                    value={draft.color}
                    onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                    className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm outline-none focus:border-blue-400"
                  />
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <p className="text-sm font-medium text-slate-700">{labels.stampLabel}</p>
              <FileDropZone
                accept="image/*,.png,.jpg,.jpeg,.webp"
                dropHint={labels.stampDropHint}
                selectHint={labels.stampSelectHint}
                onFiles={(f) => void onStampFiles(f)}
                disabled={busy}
              />
              {stampFile ? (
                <p className="text-xs text-slate-500">
                  {stampFile.name} · {formatBytes(stampFile.size)}
                </p>
              ) : null}
            </div>
          )}

          {/* Position */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">{labels.position}</p>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={draft.tile}
                  onChange={(e) => setDraft({ ...draft, tile: e.target.checked })}
                />
                {labels.tile}
              </label>
            </div>
            <div
              className={`grid grid-cols-3 gap-1.5 ${draft.tile ? "opacity-40 pointer-events-none" : ""}`}
              role="group"
              aria-label={labels.position}
            >
              {WM_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPos(pos)}
                  aria-label={labels[`pos_${pos}` as keyof typeof labels] as string}
                  className={`flex min-h-10 items-center justify-center rounded-lg border text-xs font-medium transition ${
                    draft.position === pos && !draft.tile
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                </button>
              ))}
            </div>
            {draft.tile ? (
              <label className="mt-3 block text-sm text-slate-600">
                {labels.tileGap}: {Math.round(draft.tileGap * 100)}%
                <input
                  type="range"
                  min={0.08}
                  max={0.45}
                  step={0.01}
                  value={draft.tileGap}
                  onChange={(e) =>
                    setDraft({ ...draft, tileGap: Number(e.target.value) })
                  }
                  className="mt-2 w-full accent-blue-600"
                />
              </label>
            ) : null}
          </div>

          {/* Sliders */}
          <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <label className="block text-sm text-slate-700">
              {labels.opacity}: {Math.round(draft.opacity * 100)}%
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.01}
                value={draft.opacity}
                onChange={(e) =>
                  setDraft({ ...draft, opacity: Number(e.target.value) })
                }
                className="mt-2 w-full accent-blue-600"
              />
            </label>
            <label className="block text-sm text-slate-700">
              {labels.rotation}: {draft.rotation}°
              <input
                type="range"
                min={-90}
                max={90}
                step={1}
                value={draft.rotation}
                onChange={(e) =>
                  setDraft({ ...draft, rotation: Number(e.target.value) })
                }
                className="mt-2 w-full accent-blue-600"
              />
            </label>
            <label className="block text-sm text-slate-700">
              {labels.scale}: {Math.round(draft.scale * 100)}%
              <input
                type="range"
                min={0.25}
                max={2.5}
                step={0.05}
                value={draft.scale}
                onChange={(e) =>
                  setDraft({ ...draft, scale: Number(e.target.value) })
                }
                className="mt-2 w-full accent-blue-600"
              />
            </label>
          </div>

          {busy && progress > 0 ? (
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => void run()}
              disabled={!file || busy || (draft.mode === "image" && !stampFile)}
              className="min-h-11 flex-1 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40 sm:flex-none"
            >
              {busy ? labels.processing : labels.download}
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
            >
              {labels.clear}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
