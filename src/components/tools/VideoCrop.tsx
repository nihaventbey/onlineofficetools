"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob, formatBytes, MAX_VIDEO_BYTES } from "@/lib/files/utils";
import {
  isVideoFile,
  loadVideoElement,
  revokeVideo,
} from "@/lib/files/video";
import {
  centeredCropForAspect,
  composeAndRecord,
  MAX_COMPOSE_DURATION_SEC,
  paintComposePreview,
  type VideoCropRect,
} from "@/lib/video/compose";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["videoCrop"] };

type AspectKey = "free" | "16:9" | "1:1" | "9:16" | "4:3";

const ASPECTS: { key: AspectKey; ratio: number | null }[] = [
  { key: "free", ratio: null },
  { key: "16:9", ratio: 16 / 9 },
  { key: "1:1", ratio: 1 },
  { key: "9:16", ratio: 9 / 16 },
  { key: "4:3", ratio: 4 / 3 },
];

export default function VideoCrop({ labels }: Props) {
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const [aspect, setAspect] = useState<AspectKey>("16:9");
  const [crop, setCrop] = useState<VideoCropRect>({ x: 0, y: 0, w: 100, h: 100 });
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [muteAudio, setMuteAudio] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [safariWarning, setSafariWarning] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isSafari =
      /Safari/i.test(ua) && !/Chrome|Chromium|Edg|Firefox/i.test(ua);
    setSafariWarning(isSafari || typeof MediaRecorder === "undefined");
    return () => {
      abortRef.current?.abort();
      revokeVideo(videoEl);
      if (previewSrc) URL.revokeObjectURL(previewSrc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !videoEl || !videoEl.videoWidth) return;
    try {
      paintComposePreview(canvas, videoEl, { crop });
    } catch {
      /* ignore */
    }
  }, [crop, videoEl]);

  function applyAspect(key: AspectKey, width: number, height: number) {
    setAspect(key);
    const entry = ASPECTS.find((a) => a.key === key);
    if (!entry?.ratio) {
      setCrop({ x: 0, y: 0, w: width, h: height });
      return;
    }
    setCrop(centeredCropForAspect(width, height, entry.ratio));
  }

  async function onVideo(file: File) {
    if (!isVideoFile(file)) {
      setError(labels.invalidFile);
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    setBusy(true);
    setError("");
    revokeVideo(videoEl);
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    try {
      const video = await loadVideoElement(file);
      const dur = Number.isFinite(video.duration) ? video.duration : 0;
      const w = video.videoWidth || 1;
      const h = video.videoHeight || 1;
      setVideoEl(video);
      setPreviewSrc(video.src);
      setFileName(file.name);
      setFileSize(file.size);
      setDuration(dur);
      setVw(w);
      setVh(h);
      setStartTime(0);
      setEndTime(Math.min(dur || 10, MAX_COMPOSE_DURATION_SEC, 30));
      applyAspect("16:9", w, h);
      await video.play().catch(() => undefined);
      video.pause();
      video.currentTime = 0;
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function run() {
    if (!videoEl) return;
    const start = Math.max(0, startTime);
    const end = Math.min(duration || endTime, endTime);
    if (end - start > MAX_COMPOSE_DURATION_SEC) {
      setError(labels.tooLong);
      return;
    }
    setBusy(true);
    setProgress(0);
    setError("");
    abortRef.current = new AbortController();
    try {
      const blob = await composeAndRecord({
        video: videoEl,
        start,
        end,
        crop,
        mute: muteAudio,
        signal: abortRef.current.signal,
        onProgress: (r) => setProgress(Math.round(r * 100)),
      });
      downloadBlob(blob, `${fileName.replace(/\.\w+$/, "") || "video"}-cropped.webm`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "NO_RECORDER") setError(labels.safariWarning);
      else if (msg === "TOO_LONG") setError(labels.tooLong);
      else if (msg === "ABORTED") setError("");
      else setError(labels.error);
    } finally {
      setBusy(false);
      try {
        videoEl.pause();
      } catch {
        /* ignore */
      }
    }
  }

  function resetAll() {
    abortRef.current?.abort();
    revokeVideo(videoEl);
    setVideoEl(null);
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(null);
    setError("");
    setProgress(0);
    setFileName("");
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      {safariWarning ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {labels.safariWarning}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <FileDropZone
            accept="video/*,.mp4,.webm,.mov,.m4v"
            dropHint={labels.dropHint}
            selectHint={labels.selectHint ?? ""}
            onFiles={(f) => void onVideo(f[0]!)}
            disabled={busy}
          />
          {fileName ? (
            <p className="text-sm text-slate-600">
              {fileName} · {formatBytes(fileSize)}
              {vw ? ` · ${vw}×${vh}` : ""}
              {duration ? ` · ${duration.toFixed(1)}s` : ""}
            </p>
          ) : null}
          <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <canvas
              ref={previewCanvasRef}
              className="max-h-72 max-w-full rounded-lg"
              aria-label={labels.preview}
            />
          </div>
          {previewSrc ? (
            <video
              src={previewSrc}
              controls
              playsInline
              muted
              className="max-h-40 w-full rounded-xl bg-black"
              onSeeked={() => {
                if (!videoEl || !previewCanvasRef.current) return;
                paintComposePreview(previewCanvasRef.current, videoEl, { crop });
              }}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold">{labels.aspect}</p>
            <div className="flex flex-wrap gap-2">
              {ASPECTS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  disabled={!vw || busy}
                  onClick={() => applyAspect(a.key, vw, vh)}
                  className={`min-h-10 rounded-xl px-3 text-sm font-medium ${
                    aspect === a.key
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-slate-50"
                  }`}
                >
                  {labels[`aspect_${a.key === "16:9" ? "16_9" : a.key === "9:16" ? "9_16" : a.key === "4:3" ? "4_3" : a.key === "1:1" ? "1_1" : "free"}` as keyof typeof labels] as string}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{labels.cropX}</span>
              <input
                type="number"
                min={0}
                max={vw}
                value={crop.x}
                onChange={(e) => {
                  setAspect("free");
                  setCrop({ ...crop, x: Number(e.target.value) || 0 });
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                disabled={busy || !vw}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{labels.cropY}</span>
              <input
                type="number"
                min={0}
                max={vh}
                value={crop.y}
                onChange={(e) => {
                  setAspect("free");
                  setCrop({ ...crop, y: Number(e.target.value) || 0 });
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                disabled={busy || !vw}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{labels.cropWidth}</span>
              <input
                type="number"
                min={1}
                max={vw}
                value={crop.w}
                onChange={(e) => {
                  setAspect("free");
                  setCrop({ ...crop, w: Number(e.target.value) || 1 });
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                disabled={busy || !vw}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{labels.cropHeight}</span>
              <input
                type="number"
                min={1}
                max={vh}
                value={crop.h}
                onChange={(e) => {
                  setAspect("free");
                  setCrop({ ...crop, h: Number(e.target.value) || 1 });
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                disabled={busy || !vw}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{labels.startTime}</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={startTime}
                onChange={(e) => setStartTime(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                disabled={busy}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{labels.endTime}</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                disabled={busy}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={muteAudio}
              onChange={(e) => setMuteAudio(e.target.checked)}
              disabled={busy}
            />
            {labels.muteAudio}
          </label>

          {busy && progress > 0 ? (
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void run()}
              disabled={!videoEl || busy}
              className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
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
