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
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["videoTrim"] };

export default function VideoTrim({ labels }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(5);
  const [duration, setDuration] = useState(0);
  const [muteAudio, setMuteAudio] = useState(false);
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
      setError(labels.error);
      return;
    }
    setBusy(true);
    setError("");
    abortRef.current = false;
    try {
      await seekVideo(videoEl, start);
      videoEl.muted = muteAudio;
      const stream = (
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

      await new Promise<void>((resolve) => {
        const tick = () => {
          if (abortRef.current || videoEl.currentTime >= end || videoEl.ended) {
            videoEl.pause();
            resolve();
            return;
          }
          requestAnimationFrame(tick);
        };
        tick();
      });

      if (recorder.state !== "inactive") recorder.stop();
      stream.getTracks().forEach((t) => t.stop());
      const blob = await done;
      if (!abortRef.current) downloadBlob(blob, "trimmed.webm");
    } catch {
      setError(labels.error);
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
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      {safariWarning ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {labels.safariWarning}
        </p>
      ) : null}
      <FileDropZone
        accept="video/*,.mp4,.webm,.mov,.m4v"
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={(files) => void onFile(files[0]!)}
        disabled={busy}
      />
      {previewSrc ? (
        <video
          src={previewSrc}
          controls
          playsInline
          className="max-h-64 w-full rounded-xl bg-black"
        />
      ) : null}
      {duration ? (
        <p className="text-sm text-slate-600">
          {labels.duration}: {duration.toFixed(1)}s
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">{labels.startTime}</span>
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
          <span className="mb-1 block font-medium text-slate-700">{labels.endTime}</span>
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
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={muteAudio}
          onChange={(e) => setMuteAudio(e.target.checked)}
          disabled={busy}
        />
        {labels.muteAudio}
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !videoEl}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {busy ? labels.processing : labels.download}
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
          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
        >
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
