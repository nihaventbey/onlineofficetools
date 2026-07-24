"use client";

import { useEffect, useMemo, useState } from "react";
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

type Props = { labels: Dictionary["tools"]["imageAdjust"] };
type OutputFormat = "png" | "jpeg" | "webp";

type Adjustments = {
  brightness: number;
  contrast: number;
  saturate: number;
  hue: number;
  grayscale: number;
  sepia: number;
};

const DEFAULTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hue: 0,
  grayscale: 0,
  sepia: 0,
};

function cssFilter(a: Adjustments): string {
  return [
    `brightness(${a.brightness}%)`,
    `contrast(${a.contrast}%)`,
    `saturate(${a.saturate}%)`,
    `hue-rotate(${a.hue}deg)`,
    `grayscale(${a.grayscale}%)`,
    `sepia(${a.sepia}%)`,
  ].join(" ");
}

export default function ImageAdjust({ labels }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [adj, setAdj] = useState<Adjustments>(DEFAULTS);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => revokeUrl(preview), [preview]);

  const filter = useMemo(() => cssFilter(adj), [adj]);

  function selectFile(list: File[], index: number) {
    const target = list[index];
    if (!target) return;
    setSelected(index);
    revokeUrl(preview);
    setPreview(URL.createObjectURL(target));
  }

  function onFiles(incoming: File[]) {
    const valid: File[] = [];
    for (const f of incoming) {
      if (!isImageFile(f)) {
        setError(labels.invalidFile);
        return;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        setError(labels.tooLarge);
        return;
      }
      valid.push(f);
    }
    setError("");
    const next = [...files, ...valid];
    setFiles(next);
    if (!files.length) {
      selectFile(next, 0);
    }
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    if (!next.length) {
      reset();
      return;
    }
    const nextIndex = Math.min(
      index < selected ? selected - 1 : selected,
      next.length - 1,
    );
    selectFile(next, nextIndex);
  }

  function reset() {
    setFiles([]);
    setSelected(0);
    revokeUrl(preview);
    setPreview(null);
    setAdj(DEFAULTS);
    setError("");
  }

  function setField<K extends keyof Adjustments>(key: K, value: number) {
    setAdj((prev) => ({ ...prev, [key]: value }));
  }

  async function adjustOne(file: File): Promise<{ blob: Blob; name: string }> {
    const bmp = await loadImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.filter = filter;
    ctx.drawImage(bmp, 0, 0);
    ctx.filter = "none";
    bmp.close();
    const mime =
      format === "png"
        ? "image/png"
        : format === "jpeg"
          ? "image/jpeg"
          : "image/webp";
    const blob = await canvasToBlob(
      canvas,
      mime,
      format === "png" ? undefined : quality,
    );
    const base = file.name.replace(/\.[^.]+$/, "") || "adjusted";
    return {
      blob,
      name: `${base}-adjusted.${format === "jpeg" ? "jpg" : format}`,
    };
  }

  async function run() {
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      if (files.length === 1) {
        const { blob, name } = await adjustOne(files[0]!);
        downloadBlob(blob, name);
      } else {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        for (const file of files) {
          const { blob, name } = await adjustOne(file);
          zip.file(name, blob);
        }
        const out = await zip.generateAsync({ type: "blob" });
        downloadBlob(out, "images-adjusted.zip");
      }
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  const sliders: {
    key: keyof Adjustments;
    label: string;
    min: number;
    max: number;
    step: number;
    unit: string;
  }[] = [
    { key: "brightness", label: labels.brightness, min: 0, max: 200, step: 1, unit: "%" },
    { key: "contrast", label: labels.contrast, min: 0, max: 200, step: 1, unit: "%" },
    { key: "saturate", label: labels.saturate, min: 0, max: 200, step: 1, unit: "%" },
    { key: "hue", label: labels.hue, min: -180, max: 180, step: 1, unit: "°" },
    { key: "grayscale", label: labels.grayscale, min: 0, max: 100, step: 1, unit: "%" },
    { key: "sepia", label: labels.sepia, min: 0, max: 100, step: 1, unit: "%" },
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <FileDropZone
        accept="image/*"
        multiple
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={onFiles}
        disabled={busy}
      />

      {files.length ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            {labels.fileCount.replace("{count}", String(files.length))}
            {files.length > 1 ? ` — ${labels.batchHint}` : ""}
          </p>
          <ul className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <li key={`${file.name}-${file.size}-${index}`}>
                <span
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm ${
                    index === selected
                      ? "border-orange-500 bg-orange-50 text-orange-800"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectFile(files, index)}
                    disabled={busy}
                    className="max-w-40 truncate text-left"
                  >
                    {file.name}
                  </button>
                  <span className="text-xs text-slate-400">
                    {formatBytes(file.size)}
                  </span>
                  <button
                    type="button"
                    aria-label={labels.remove}
                    onClick={() => removeFile(index)}
                    disabled={busy}
                    className="text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {preview ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {labels.original}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              className="max-h-72 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {labels.preview}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              style={{ filter }}
              className="max-h-72 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {sliders.map((s) => (
          <label key={s.key} className="block text-sm">
            <span className="mb-1 flex items-center justify-between font-medium text-slate-700">
              <span>{s.label}</span>
              <span className="tabular-nums text-slate-500">
                {adj[s.key]}
                {s.unit}
              </span>
            </span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={adj[s.key]}
              onChange={(e) => setField(s.key, Number(e.target.value))}
              disabled={!files.length || busy}
              className="w-full"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <fieldset>
          <legend className="mb-1 text-sm font-medium text-slate-700">
            {labels.format}
          </legend>
          <div className="flex flex-wrap gap-2">
            {(["png", "jpeg", "webp"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                disabled={busy}
                className={`min-h-10 rounded-xl px-3 text-sm font-medium ${
                  format === f
                    ? "bg-orange-600 text-white"
                    : "border border-slate-200 bg-slate-50"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </fieldset>
        {format !== "png" ? (
          <label className="block min-w-[10rem] flex-1 text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              {labels.quality}
            </span>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.01}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              disabled={busy}
              className="w-full"
            />
          </label>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={!files.length || busy}
          className="min-h-11 rounded-xl bg-orange-600 px-4 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-40"
        >
          {busy
            ? labels.processing
            : files.length > 1
              ? labels.downloadAll
              : labels.download}
        </button>
        <button
          type="button"
          onClick={() => setAdj(DEFAULTS)}
          disabled={!files.length || busy}
          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium disabled:opacity-40"
        >
          {labels.reset}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={busy}
          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
        >
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
