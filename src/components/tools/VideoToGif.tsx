"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob, MAX_VIDEO_BYTES } from "@/lib/files/utils";
import {
  drawVideoFrame,
  isVideoFile,
  loadVideoElement,
  MAX_GIF_DURATION_SEC,
  MAX_GIF_WIDTH,
  revokeVideo,
  seekVideo,
} from "@/lib/files/video";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["videoToGif"] };

export default function VideoToGif({ labels }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(3);
  const [fps, setFps] = useState(8);
  const [width, setWidth] = useState(320);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
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
      setEndTime(Math.min(MAX_GIF_DURATION_SEC, dur || MAX_GIF_DURATION_SEC));
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
    if (end <= start) {
      setError(labels.error);
      return;
    }
    if (end - start > MAX_GIF_DURATION_SEC) {
      setError(labels.maxDurationHint);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
      const gif = GIFEncoder();
      const frameFps = Math.min(15, Math.max(1, fps));
      const delay = Math.round(1000 / frameFps);
      const maxW = Math.min(MAX_GIF_WIDTH, Math.max(64, width));
      let first = true;
      for (let t = start; t < end; t += 1 / frameFps) {
        await seekVideo(videoEl, t);
        const canvas = drawVideoFrame(videoEl, maxW);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas");
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, canvas.width, canvas.height, {
          palette,
          delay,
          repeat: first ? 0 : undefined,
        });
        first = false;
      }
      gif.finish();
      const bytes = gif.bytes();
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      downloadBlob(new Blob([copy], { type: "image/gif" }), "clip.gif");
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <p className="text-xs text-slate-500">{labels.maxDurationHint}</p>
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
          muted
          playsInline
          className="max-h-64 w-full rounded-xl bg-black"
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">{labels.startTime}</span>
          <input
            type="number"
            min={0}
            step={0.1}
            max={duration || undefined}
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
            max={duration || undefined}
            value={endTime}
            onChange={(e) => setEndTime(Number(e.target.value) || 0)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            disabled={busy}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">{labels.fps}</span>
          <input
            type="number"
            min={1}
            max={15}
            value={fps}
            onChange={(e) => setFps(Number(e.target.value) || 8)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            disabled={busy}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">{labels.width}</span>
          <input
            type="number"
            min={64}
            max={MAX_GIF_WIDTH}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value) || 320)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            disabled={busy}
          />
        </label>
      </div>
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
