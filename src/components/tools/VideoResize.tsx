"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import VideoCropOverlay from "@/components/tools/video/VideoCropOverlay";

type Props = { labels: Dictionary["tools"]["videoResize"] };

type Orientation = "vertical" | "horizontal" | "square";

type Preset = {
  id: string;
  group: Orientation;
  width: number;
  height: number;
  labelKey: keyof Dictionary["tools"]["videoResize"];
};

const PRESETS: Preset[] = [
  { id: "reels", group: "vertical", width: 1080, height: 1920, labelKey: "presetReels" },
  { id: "stories", group: "vertical", width: 1080, height: 1920, labelKey: "presetStories" },
  { id: "shorts", group: "vertical", width: 1080, height: 1920, labelKey: "presetShorts" },
  { id: "tiktok", group: "vertical", width: 1080, height: 1920, labelKey: "presetTiktok" },
  { id: "yt1080", group: "horizontal", width: 1920, height: 1080, labelKey: "presetYt1080" },
  { id: "yt720", group: "horizontal", width: 1280, height: 720, labelKey: "presetYt720" },
  { id: "fbLand", group: "horizontal", width: 1280, height: 720, labelKey: "presetFbLand" },
  { id: "xLand", group: "horizontal", width: 1280, height: 720, labelKey: "presetXLand" },
  { id: "igSquare", group: "square", width: 1080, height: 1080, labelKey: "presetIgSquare" },
];

export default function VideoResize({ labels }: Props) {
  const [group, setGroup] = useState<Orientation>("vertical");
  const [presetId, setPresetId] = useState("reels");
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
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

  const preset = useMemo(
    () => PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]!,
    [presetId],
  );
  const aspectRatio = preset.width / preset.height;
  const groupPresets = PRESETS.filter((p) => p.group === group);

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
      paintComposePreview(canvas, videoEl, {
        crop,
        outputSize: { width: preset.width, height: preset.height },
        maxWidth: Math.max(preset.width, 1280),
      });
    } catch {
      /* ignore */
    }
  }, [crop, videoEl, preset]);

  function applyPreset(p: Preset, width: number, height: number) {
    setPresetId(p.id);
    setGroup(p.group);
    setCrop(centeredCropForAspect(width, height, p.width / p.height));
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
      applyPreset(preset, w, h);
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
        outputSize: { width: preset.width, height: preset.height },
        maxWidth: Math.max(preset.width, 1920),
        signal: abortRef.current.signal,
        onProgress: (r) => setProgress(Math.round(r * 100)),
      });
      downloadBlob(
        blob,
        `${fileName.replace(/\.\w+$/, "") || "video"}-${preset.width}x${preset.height}.webm`,
      );
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

      {!previewSrc ? (
        <FileDropZone
          accept="video/*,.mp4,.webm,.mov,.m4v"
          dropHint={labels.dropHint}
          selectHint={labels.selectHint ?? ""}
          onFiles={(f) => void onVideo(f[0]!)}
          disabled={busy}
        />
      ) : (
        <p className="text-sm text-slate-600">
          {fileName} · {formatBytes(fileSize)}
          {vw ? ` · ${vw}×${vh}` : ""}
          {duration ? ` · ${duration.toFixed(1)}s` : ""}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["vertical", labels.groupVertical],
            ["horizontal", labels.groupHorizontal],
            ["square", labels.groupSquare],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setGroup(key);
              const first = PRESETS.find((p) => p.group === key);
              if (first && vw) applyPreset(first, vw, vh);
              else if (first) {
                setPresetId(first.id);
              }
            }}
            className={`min-h-10 rounded-xl px-3 text-sm font-medium ${
              group === key
                ? "bg-violet-600 text-white"
                : "border border-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {groupPresets.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy}
            onClick={() => (vw ? applyPreset(p, vw, vh) : setPresetId(p.id))}
            className={`min-h-10 rounded-xl px-3 text-left text-sm ${
              presetId === p.id
                ? "bg-sky-600 text-white"
                : "border border-slate-200 bg-slate-50"
            }`}
          >
            <span className="font-medium">{labels[p.labelKey] as string}</span>
            <span className="ml-2 opacity-80">
              {p.width}×{p.height}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">{labels.dragHint}</p>
          <VideoCropOverlay
            videoSrc={previewSrc}
            videoWidth={vw}
            videoHeight={vh}
            crop={crop}
            aspectRatio={aspectRatio}
            disabled={busy || !vw}
            className="max-h-[28rem]"
            onChange={setCrop}
            onSeeked={() => {
              if (!videoEl || !previewCanvasRef.current) return;
              paintComposePreview(previewCanvasRef.current, videoEl, {
                crop,
                outputSize: { width: preset.width, height: preset.height },
              });
            }}
          />
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold">
              {labels.outputPreview} ({preset.width}×{preset.height})
            </p>
            <div className="flex min-h-[160px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <canvas
                ref={previewCanvasRef}
                className="max-h-56 max-w-full rounded-lg"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["x", labels.cropX],
                ["y", labels.cropY],
                ["w", labels.cropWidth],
                ["h", labels.cropHeight],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="mb-1 block font-medium">{label}</span>
                <input
                  type="number"
                  value={crop[key]}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    const next = { ...crop, [key]: v };
                    // Keep aspect when editing w/h
                    if (key === "w") next.h = Math.round(v / aspectRatio);
                    if (key === "h") next.w = Math.round(v * aspectRatio);
                    setCrop(next);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  disabled={busy || !vw}
                />
              </label>
            ))}
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
                className="h-full rounded-full bg-sky-600 transition-all"
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
              className="min-h-11 rounded-xl bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-40"
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
