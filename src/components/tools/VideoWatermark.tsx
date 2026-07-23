"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";
import {
  downloadBlob,
  formatBytes,
  isImageFile,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from "@/lib/files/utils";
import {
  isVideoFile,
  loadVideoElement,
  revokeVideo,
} from "@/lib/files/video";
import {
  composeAndRecord,
  MAX_COMPOSE_DURATION_SEC,
  paintComposePreview,
} from "@/lib/video/compose";
import {
  DEFAULT_WATERMARK,
  WM_FONT_CSS,
  WM_POSITIONS,
  type WatermarkOptions,
  type WmFontId,
  type WmPosition,
} from "@/lib/watermark/types";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["videoWatermark"] };

type Draft = WatermarkOptions;

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

export default function VideoWatermark({ labels }: Props) {
  const [draft, setDraft, clearDraft] = useToolDraft<Draft>("video-watermark", {
    ...DEFAULT_WATERMARK,
    text: labels.defaultText,
  });
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [muteAudio, setMuteAudio] = useState(false);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [safariWarning, setSafariWarning] = useState(false);
  const stampBmpRef = useRef<ImageBitmap | null>(null);
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
      stampBmpRef.current?.close();
      if (previewSrc) URL.revokeObjectURL(previewSrc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !videoEl || !videoEl.videoWidth) return;
    try {
      paintComposePreview(canvas, videoEl, {
        watermark: draft,
        stampBitmap: stampBmpRef.current,
      });
    } catch {
      /* preview non-fatal */
    }
  }, [draft, videoEl, stampFile, startTime]);

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
      setVideoEl(video);
      setPreviewSrc(video.src);
      setFileName(file.name);
      setFileSize(file.size);
      setDuration(dur);
      setStartTime(0);
      setEndTime(Math.min(dur || 10, MAX_COMPOSE_DURATION_SEC, 30));
      await video.play().catch(() => undefined);
      video.pause();
      video.currentTime = 0;
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function onStamp(file: File) {
    if (!isImageFile(file)) {
      setError(labels.invalidStamp);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    try {
      const bmp = await createImageBitmap(file);
      stampBmpRef.current?.close();
      stampBmpRef.current = bmp;
      setStampFile(file);
      setError("");
    } catch {
      setError(labels.invalidStamp);
    }
  }

  async function run() {
    if (!videoEl) return;
    if (draft.mode === "text" && !draft.text.trim()) {
      setError(labels.emptyText);
      return;
    }
    if (draft.mode === "image" && !stampBmpRef.current) {
      setError(labels.needStamp);
      return;
    }
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
        watermark: draft,
        stampBitmap: stampBmpRef.current,
        mute: muteAudio,
        signal: abortRef.current.signal,
        onProgress: (r) => setProgress(Math.round(r * 100)),
      });
      downloadBlob(blob, `${fileName.replace(/\.\w+$/, "") || "video"}-watermarked.webm`);
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
    clearDraft();
    revokeVideo(videoEl);
    setVideoEl(null);
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(null);
    stampBmpRef.current?.close();
    stampBmpRef.current = null;
    setStampFile(null);
    setError("");
    setProgress(0);
    setFileName("");
    setFileSize(0);
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
                paintComposePreview(previewCanvasRef.current, videoEl, {
                  watermark: draft,
                  stampBitmap: stampBmpRef.current,
                });
              }}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["text", "image"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDraft({ ...draft, mode })}
                className={`min-h-11 rounded-xl text-sm font-medium ${
                  draft.mode === mode
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-slate-50"
                }`}
              >
                {mode === "text" ? labels.modeText : labels.modeImage}
              </button>
            ))}
          </div>

          {draft.mode === "text" ? (
            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{labels.textLabel}</span>
                <input
                  type="text"
                  value={draft.text}
                  onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{labels.fontLabel}</span>
                <select
                  value={draft.fontId}
                  onChange={(e) =>
                    setDraft({ ...draft, fontId: e.target.value as WmFontId })
                  }
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  style={{ fontFamily: WM_FONT_CSS[draft.fontId] }}
                >
                  {FONTS.map((id) => (
                    <option key={id} value={id}>
                      {FONT_LABEL[id]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{labels.colorLabel}</span>
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                  className="h-11 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <FileDropZone
                accept="image/*"
                dropHint={labels.stampDropHint}
                selectHint={labels.stampSelectHint}
                onFiles={(f) => void onStamp(f[0]!)}
                disabled={busy}
              />
              {stampFile ? (
                <p className="text-xs text-slate-500">{stampFile.name}</p>
              ) : null}
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">{labels.position}</p>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={draft.tile}
                  onChange={(e) => setDraft({ ...draft, tile: e.target.checked })}
                />
                {labels.tile}
              </label>
            </div>
            <div
              className={`grid grid-cols-3 gap-1.5 ${draft.tile ? "pointer-events-none opacity-40" : ""}`}
            >
              {WM_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() =>
                    setDraft({ ...draft, position: pos as WmPosition, tile: false })
                  }
                  className={`flex min-h-10 items-center justify-center rounded-lg border ${
                    draft.position === pos && !draft.tile
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <label className="block text-sm">
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
            <label className="block text-sm">
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
            <label className="block text-sm">
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
