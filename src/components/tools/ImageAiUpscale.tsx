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

type Props = { labels: Dictionary["tools"]["imageAiUpscale"] };

/** Small ESRGAN-style models are large; beta loads from CDN on user action. */
const MODEL_URL =
  "https://media.githubusercontent.com/media/xinntao/Real-ESRGAN/master/models/RealESRGAN_x2plus.onnx";

async function canvasUpscale2x(file: File): Promise<Blob> {
  const bmp = await loadImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width * 2;
  canvas.height = bmp.height * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvasToBlob(canvas, "image/png");
}

export default function ImageAiUpscale({ labels }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [ortAvailable, setOrtAvailable] = useState<boolean | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    revokeUrl(preview);
    revokeUrl(result);
  }, [preview, result]);

  useEffect(() => {
    void import("onnxruntime-web")
      .then(() => setOrtAvailable(true))
      .catch(() => setOrtAvailable(false));
  }, []);

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
    setUsedFallback(false);
    setFile(incoming);
    revokeUrl(preview);
    revokeUrl(result);
    setPreview(URL.createObjectURL(incoming));
    setResult(null);
  }

  async function runAi() {
    if (!file) return;
    setBusy(true);
    setError("");
    setUsedFallback(false);
    try {
      if (ortAvailable === false) {
        const blob = await canvasUpscale2x(file);
        setUsedFallback(true);
        revokeUrl(result);
        setResult(URL.createObjectURL(blob));
        downloadBlob(blob, `upscaled-2x-${file.name.replace(/\.\w+$/, "")}.png`);
        return;
      }

      setLoadingModel(true);
      const ort = await import("onnxruntime-web");
      setLoadingModel(false);

      // Beta: attempt CDN model; fall back to canvas 2× if inference fails.
      try {
        const session = await ort.InferenceSession.create(MODEL_URL, {
          executionProviders: ["wasm"],
        });
        const bmp = await loadImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas");
        ctx.drawImage(bmp, 0, 0);
        bmp.close();
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // ort is dynamically imported; keep types loose for beta path
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Ort = ort as any;
        const input = new Ort.Tensor("float32", normalizeRgb(imageData), [
          1,
          3,
          canvas.height,
          canvas.width,
        ]);
        const feeds: Record<string, unknown> = {};
        feeds[session.inputNames[0]!] = input;
        const output = await session.run(feeds as never);
        const tensor = output[session.outputNames[0]!];
        const outCanvas = tensorToCanvas(tensor, canvas.width * 2, canvas.height * 2);
        const blob = await canvasToBlob(outCanvas, "image/png");
        revokeUrl(result);
        setResult(URL.createObjectURL(blob));
        downloadBlob(blob, `ai-upscaled-${file.name.replace(/\.\w+$/, "")}.png`);
      } catch {
        const blob = await canvasUpscale2x(file);
        setUsedFallback(true);
        revokeUrl(result);
        setResult(URL.createObjectURL(blob));
        downloadBlob(blob, `upscaled-2x-${file.name.replace(/\.\w+$/, "")}.png`);
      }
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
      setLoadingModel(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <p className="text-sm text-slate-600">{labels.privacyNote}</p>
      {ortAvailable === false ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {labels.unsupported}{" "}
          <span className="block mt-1 text-xs">Canvas 2× upscale will be used instead.</span>
        </p>
      ) : (
        <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900">
          Beta: AI model loads from CDN when you click {labels.start}. Falls back to canvas 2× if unavailable.
        </p>
      )}
      <FileDropZone accept="image/*" dropHint={labels.dropHint} selectHint={labels.selectHint ?? ""} onFiles={(f) => void onFile(f[0])} disabled={busy} />
      {file ? <p className="text-sm text-slate-600">{file.name} · {formatBytes(file.size)}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="max-h-48 rounded-xl border border-slate-200 object-contain" />
        ) : null}
        {result ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={result} alt="" className="max-h-48 rounded-xl border border-slate-200 object-contain" />
        ) : null}
      </div>
      {loadingModel ? <p className="text-sm text-slate-500">{labels.loadingModel}</p> : null}
      {usedFallback ? (
        <p className="text-xs text-slate-500">Used canvas 2× fallback (AI model unavailable).</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void runAi()} disabled={!file || busy} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40">
          {busy ? labels.processing : labels.start}
        </button>
        <button type="button" onClick={() => { setFile(null); revokeUrl(preview); revokeUrl(result); setPreview(null); setResult(null); setError(""); }} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
    </div>
  );
}

function normalizeRgb(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData;
  const out = new Float32Array(3 * width * height);
  for (let i = 0; i < width * height; i++) {
    out[i] = data[i * 4]! / 255;
    out[width * height + i] = data[i * 4 + 1]! / 255;
    out[2 * width * height + i] = data[i * 4 + 2]! / 255;
  }
  return out;
}

function tensorToCanvas(tensor: { data: Float32Array | unknown }, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const data = tensor.data as Float32Array;
  const imageData = ctx.createImageData(width, height);
  const plane = (width * height);
  for (let i = 0; i < width * height; i++) {
    imageData.data[i * 4] = clamp255(data[i]! * 255);
    imageData.data[i * 4 + 1] = clamp255(data[plane + i]! * 255);
    imageData.data[i * 4 + 2] = clamp255(data[2 * plane + i]! * 255);
    imageData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function clamp255(v: number): number {
  return Math.min(255, Math.max(0, Math.round(v)));
}
