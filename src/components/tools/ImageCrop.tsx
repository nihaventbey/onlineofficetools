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
import ImageCropOverlay, {
  clampCropRect,
  type CropRect,
} from "@/components/tools/image/ImageCropOverlay";

type Props = { labels: Dictionary["tools"]["imageCrop"] };

type AspectKey = "free" | "16:9" | "1:1" | "9:16" | "4:3";

const ASPECT_RATIOS: Record<Exclude<AspectKey, "free">, number> = {
  "16:9": 16 / 9,
  "1:1": 1,
  "9:16": 9 / 16,
  "4:3": 4 / 3,
};

function centeredRect(iw: number, ih: number, ratio: number | null): CropRect {
  if (!ratio) {
    return { x: 0, y: 0, w: iw, h: ih };
  }
  let w = iw;
  let h = w / ratio;
  if (h > ih) {
    h = ih;
    w = h * ratio;
  }
  return clampCropRect(
    { x: (iw - w) / 2, y: (ih - h) / 2, w, h },
    iw,
    ih,
    null,
  );
}

export default function ImageCrop({ labels }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [aspect, setAspect] = useState<AspectKey>("free");
  const [rotate, setRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => revokeUrl(preview), [preview]);

  async function selectFile(list: File[], index: number) {
    const target = list[index];
    if (!target) return;
    setSelected(index);
    revokeUrl(preview);
    setPreview(URL.createObjectURL(target));
    const bmp = await loadImageBitmap(target);
    setOrigW(bmp.width);
    setOrigH(bmp.height);
    setCrop(
      centeredRect(
        bmp.width,
        bmp.height,
        aspect === "free" ? null : ASPECT_RATIOS[aspect],
      ),
    );
    bmp.close();
  }

  async function onFiles(incoming: File[]) {
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
      await selectFile(next, 0);
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
    void selectFile(next, nextIndex);
  }

  function reset() {
    setFiles([]);
    setSelected(0);
    revokeUrl(preview);
    setPreview(null);
    setOrigW(0);
    setOrigH(0);
    setCrop({ x: 0, y: 0, w: 0, h: 0 });
    setAspect("free");
    setRotate(0);
    setFlipH(false);
    setFlipV(false);
    setError("");
  }

  function applyAspect(key: AspectKey) {
    setAspect(key);
    if (!origW || !origH) return;
    setCrop(
      centeredRect(origW, origH, key === "free" ? null : ASPECT_RATIOS[key]),
    );
  }

  function setCropField(field: keyof CropRect, value: number) {
    setAspect("free");
    setCrop((prev) =>
      clampCropRect({ ...prev, [field]: value }, origW, origH, null),
    );
  }

  async function cropOne(file: File): Promise<Blob> {
    const bmp = await loadImageBitmap(file);
    // Apply the selection proportionally so batch images of any size crop alike.
    const fx = origW ? crop.x / origW : 0;
    const fy = origH ? crop.y / origH : 0;
    const fw = origW ? crop.w / origW : 1;
    const fh = origH ? crop.h / origH : 1;
    const sx = Math.round(fx * bmp.width);
    const sy = Math.round(fy * bmp.height);
    const sw = Math.max(1, Math.round(fw * bmp.width));
    const sh = Math.max(1, Math.round(fh * bmp.height));

    const swapped = rotate % 180 !== 0;
    const canvas = document.createElement("canvas");
    canvas.width = swapped ? sh : sw;
    canvas.height = swapped ? sw : sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(bmp, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
    bmp.close();
    return canvasToBlob(canvas, "image/png");
  }

  async function run() {
    if (!files.length || !crop.w || !crop.h) return;
    setBusy(true);
    setError("");
    try {
      if (files.length === 1) {
        const blob = await cropOne(files[0]!);
        downloadBlob(blob, `cropped-${files[0]!.name.replace(/\.\w+$/, "")}.png`);
      } else {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        for (const file of files) {
          const blob = await cropOne(file);
          zip.file(`cropped-${file.name.replace(/\.\w+$/, "")}.png`, blob);
        }
        const out = await zip.generateAsync({ type: "blob" });
        downloadBlob(out, "images-cropped.zip");
      }
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  const presets: { key: AspectKey; label: string }[] = [
    { key: "free", label: labels.aspect_free },
    { key: "9:16", label: `${labels.presetVertical} 9:16` },
    { key: "16:9", label: `${labels.presetHorizontal} 16:9` },
    { key: "1:1", label: `${labels.presetSquare} 1:1` },
    { key: "4:3", label: labels.aspect_4_3 },
  ];

  const cropFields: { field: keyof CropRect; label: string; max: number }[] = [
    { field: "x", label: labels.cropX, max: origW },
    { field: "y", label: labels.cropY, max: origH },
    { field: "w", label: labels.cropWidth, max: origW },
    { field: "h", label: labels.cropHeight, max: origH },
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <FileDropZone
        accept="image/*"
        multiple
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={(f) => void onFiles(f)}
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
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void selectFile(files, index)}
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

      {preview && origW > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">{labels.dragHint}</p>
          <ImageCropOverlay
            src={preview}
            imgWidth={origW}
            imgHeight={origH}
            crop={crop}
            onChange={setCrop}
            aspectRatio={aspect === "free" ? null : ASPECT_RATIOS[aspect]}
            disabled={busy}
            className="max-h-[28rem]"
          />
          <p className="text-xs text-slate-500">
            {origW}×{origH} → {crop.w}×{crop.h}
          </p>
        </div>
      ) : null}

      {origW > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">{labels.aspect}</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => applyAspect(b.key)}
                disabled={busy}
                className={`min-h-10 rounded-xl px-3 text-sm font-medium ${
                  aspect === b.key ? "bg-blue-600 text-white" : "border border-slate-200"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {origW > 0 ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {cropFields.map((f) => (
            <label key={f.field} className="text-sm text-slate-600">
              {f.label}
              <input
                type="number"
                min={0}
                max={f.max || 9999}
                value={crop[f.field]}
                onChange={(e) => setCropField(f.field, Number(e.target.value))}
                disabled={busy}
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
              />
            </label>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRotate((r) => (r + 90) % 360)}
          disabled={busy}
          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
        >
          {labels.rotate} ({rotate}°)
        </button>
        <button
          type="button"
          onClick={() => setFlipH((v) => !v)}
          disabled={busy}
          className={`min-h-11 rounded-xl px-4 text-sm font-medium ${flipH ? "bg-blue-600 text-white" : "border border-slate-200"}`}
        >
          {labels.flipH}
        </button>
        <button
          type="button"
          onClick={() => setFlipV((v) => !v)}
          disabled={busy}
          className={`min-h-11 rounded-xl px-4 text-sm font-medium ${flipV ? "bg-blue-600 text-white" : "border border-slate-200"}`}
        >
          {labels.flipV}
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={!files.length || busy}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {busy
            ? labels.processing
            : files.length > 1
              ? labels.downloadAll
              : labels.download}
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
