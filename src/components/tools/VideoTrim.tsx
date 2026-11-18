"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob, MAX_VIDEO_BYTES } from "@/lib/files/utils";
import {
  isVideoFile,
  loadVideoElement,
  pickRecorderMime,
  revokeVideo,
  seekVideo,
} from "@/lib/files/video";
import {
  composeAndRecord,
  centeredCropForAspect,
  type VideoCropRect,
} from "@/lib/video/compose";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["videoTrim"] };

type AspectPreset = "original" | "16:9" | "9:16" | "1:1" | "4:3";
type ScalePreset = "original" | "1080p" | "720p" | "480p";

export default function VideoTrim({ labels }: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(5);
  const [duration, setDuration] = useState(0);
  const [muteAudio, setMuteAudio] = useState(false);
  const [aspect, setAspect] = useState<AspectPreset>("original");
  const [scale, setScale] = useState<ScalePreset>("original");
  const [safariWarning, setSafariWarning] = useState(false);

  const abortRef = useRef(false);

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isSafari =
      /Safari/i.test(ua) && !/Chrome|Chromium|Edg|Firefox/i.test(ua);
    setSafariWarning(isSafari || typeof MediaRecorder === "undefined");
    return () => {
      abortRef.current = true;
      revokeVideo(videoEl);
      if (previewSrc) URL.revokeObjectURL(previewSrc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onFile(file: File) {
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
      setDuration(dur);
      setFileName(file.name);
      setStartTime(0);
      setEndTime(Math.min(5, dur || 5));
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function run() {
    if (!videoEl) return;
    if (typeof MediaRecorder === "undefined") {
      setError(labels.safariWarning);
      return;
    }
    const start = Math.max(0, startTime);
    const end = Math.min(duration || endTime, endTime);
    if (end <= start) {
      setError(labels.error || "End time must be greater than start time.");
      return;
    }

    setBusy(true);
    setProgress(0);
    setError("");
    abortRef.current = false;

    try {
      const vw = videoEl.videoWidth || 1280;
      const vh = videoEl.videoHeight || 720;

      // Determine if advanced crop / resize is requested
      const needsCompose = aspect !== "original" || scale !== "original";

      if (needsCompose) {
        let cropRect: VideoCropRect | undefined = undefined;
        if (aspect !== "original") {
          const ratioMap: Record<string, number> = {
            "16:9": 16 / 9,
            "9:16": 9 / 16,
            "1:1": 1,
            "4:3": 4 / 3,
          };
          const targetRatio = ratioMap[aspect];
          if (targetRatio) {
            cropRect = centeredCropForAspect(vw, vh, targetRatio);
          }
        }

        let maxWidth = 1280;
        if (scale === "1080p") maxWidth = 1920;
        else if (scale === "720p") maxWidth = 1280;
        else if (scale === "480p") maxWidth = 854;

        const blob = await composeAndRecord({
          video: videoEl,
          start,
          end,
          crop: cropRect,
          mute: muteAudio,
          maxWidth,
          onProgress: (ratio) => setProgress(Math.min(100, Math.round(ratio * 100))),
        });

        if (!abortRef.current) {
          const baseName = fileName ? fileName.replace(/\.[^.]+$/, "") : "video";
          downloadBlob(blob, `${baseName}-edited.webm`);
        }
      } else {
        // Fast direct stream capture for standard trim & mute
        await seekVideo(videoEl, start);
        videoEl.muted = muteAudio;
        const stream =
          (
            videoEl as HTMLVideoElement & {
              captureStream?: (frameRate?: number) => MediaStream;
              mozCaptureStream?: (frameRate?: number) => MediaStream;
            }
          ).captureStream?.(30) ??
          (
            videoEl as HTMLVideoElement & {
              mozCaptureStream?: (frameRate?: number) => MediaStream;
            }
          ).mozCaptureStream?.(30);

        if (!stream) {
          setError(labels.safariWarning);
          return;
        }

        let recordStream: MediaStream = stream;
        if (muteAudio) {
          recordStream = new MediaStream(stream.getVideoTracks());
        }

        const mime = pickRecorderMime();
        const chunks: BlobPart[] = [];
        const recorder = new MediaRecorder(recordStream, { mimeType: mime });
        recorder.ondataavailable = (e) => {
          if (e.data.size) chunks.push(e.data);
        };

        const done = new Promise<Blob>((resolve, reject) => {
          recorder.onstop = () =>
            resolve(new Blob(chunks, { type: mime.split(";")[0] || "video/webm" }));
          recorder.onerror = () => reject(new Error("recorder"));
        });

        recorder.start(100);
        await videoEl.play();

        const totalDiff = end - start;
        await new Promise<void>((resolve) => {
          const tick = () => {
            if (abortRef.current || videoEl.currentTime >= end || videoEl.ended) {
              videoEl.pause();
              resolve();
              return;
            }
            const pct = Math.min(100, Math.round(((videoEl.currentTime - start) / totalDiff) * 100));
            setProgress(pct);
            requestAnimationFrame(tick);
          };
          tick();
        });

        if (recorder.state !== "inactive") recorder.stop();
        stream.getTracks().forEach((t) => t.stop());
        const blob = await done;
        if (!abortRef.current) {
          const baseName = fileName ? fileName.replace(/\.[^.]+$/, "") : "video";
          downloadBlob(blob, `${baseName}-edited.webm`);
        }
      }
    } catch {
      setError(labels.error || "Processing failed");
    } finally {
      setBusy(false);
      try {
        videoEl.pause();
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {labels.title || "Video Quick Studio (Trim, Crop, Resize & Mute)"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {labels.limitHint || "Cut duration, crop aspect ratios, scale resolution and mute in one single render pass."}
          </p>
        </div>
      </div>

      {safariWarning ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {labels.safariWarning}
        </p>
      ) : null}

      <FileDropZone
        accept="video/*,.mp4,.webm,.mov,.m4v"
        dropHint={labels.dropHint || "Drop a video file here"}
        selectHint={labels.selectHint ?? "Supports MP4, WebM, MOV"}
        onFiles={(files) => void onFile(files[0]!)}
        disabled={busy}
      />

      {previewSrc ? (
        <video
          src={previewSrc}
          controls
          playsInline
          className="max-h-64 w-full rounded-xl bg-black object-contain shadow-sm"
        />
      ) : null}

      {duration ? (
        <p className="text-xs font-medium text-slate-600">
          {labels.duration || "Duration"}: {duration.toFixed(1)}s • Original resolution: {videoEl?.videoWidth} × {videoEl?.videoHeight}
        </p>
      ) : null}

      {/* Unified Controls Grid */}
      {videoEl && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          {/* 1. Trim Controls */}
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              ✂️ 1. Duration (Trim)
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs">
                <span className="mb-1 block font-medium text-slate-700">{labels.startTime}</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={startTime}
                  onChange={(e) => setStartTime(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                  disabled={busy}
                />
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-medium text-slate-700">{labels.endTime}</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={endTime}
                  onChange={(e) => setEndTime(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                  disabled={busy}
                />
              </label>
            </div>
          </div>

          {/* 2. Crop & Resize Controls */}
          <div className="grid gap-3 sm:grid-cols-2 border-t border-slate-200 pt-3">
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                📐 2. Aspect Ratio (Crop)
              </span>
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value as AspectPreset)}
                disabled={busy}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
              >
                <option value="original">Original Aspect Ratio</option>
                <option value="16:9">16:9 (YouTube, Landscape)</option>
                <option value="9:16">9:16 (Shorts, Reels, TikTok)</option>
                <option value="1:1">1:1 (Instagram Square)</option>
                <option value="4:3">4:3 (Classic Video)</option>
              </select>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                📺 3. Resolution (Resize)
              </span>
              <select
                value={scale}
                onChange={(e) => setScale(e.target.value as ScalePreset)}
                disabled={busy}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
              >
                <option value="original">Original Resolution</option>
                <option value="1080p">1080p Full HD</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p SD (Fast)</option>
              </select>
            </div>
          </div>

          {/* 3. Audio & Sound Control */}
          <div className="border-t border-slate-200 pt-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={muteAudio}
                onChange={(e) => setMuteAudio(e.target.checked)}
                disabled={busy}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              🔇 {labels.muteAudio || "Mute Audio Track (Strip Sound)"}
            </label>
          </div>
        </div>
      )}

      {busy && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-600">
            <span>{labels.processing || "Rendering video..."}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-indigo-600 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !videoEl}
          className="min-h-11 rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition shadow-sm"
        >
          {busy ? (labels.processing || "Rendering...") : "🎬 Export Video"}
        </button>
        <button
          type="button"
          onClick={() => {
            abortRef.current = true;
            revokeVideo(videoEl);
            setVideoEl(null);
            if (previewSrc) URL.revokeObjectURL(previewSrc);
            setPreviewSrc(null);
            setError("");
          }}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
