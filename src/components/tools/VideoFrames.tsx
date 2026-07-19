"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob, MAX_VIDEO_BYTES } from "@/lib/files/utils";
import {
  drawVideoFrame,
  isVideoFile,
  loadVideoElement,
  MAX_FRAME_EXTRACT,
  revokeVideo,
  seekVideo,
} from "@/lib/files/video";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["videoFrames"] };

export default function VideoFrames({ labels }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [intervalSec, setIntervalSec] = useState(1);
  const [frames, setFrames] = useState<string[]>([]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      revokeVideo(videoEl);
      for (const url of frames) URL.revokeObjectURL(url);
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
    for (const url of frames) URL.revokeObjectURL(url);
    setFrames([]);
    revokeVideo(videoEl);
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    try {
      const video = await loadVideoElement(file);
      setVideoEl(video);
      setPreviewSrc(video.src);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function capture() {
    if (!videoEl) return;
    setBusy(true);
    setError("");
    for (const url of frames) URL.revokeObjectURL(url);
    setFrames([]);
    try {
      const duration = Number.isFinite(videoEl.duration) ? videoEl.duration : 0;
      const step = Math.max(0.1, intervalSec);
      const urls: string[] = [];
      for (let t = 0; t < duration && urls.length < MAX_FRAME_EXTRACT; t += step) {
        await seekVideo(videoEl, t);
        const canvas = drawVideoFrame(videoEl, 1280);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("toBlob"))),
            "image/png",
          );
        });
        urls.push(URL.createObjectURL(blob));
      }
      if (!urls.length && duration > 0) {
        await seekVideo(videoEl, 0);
        const canvas = drawVideoFrame(videoEl, 1280);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("toBlob"))),
            "image/png",
          );
        });
        urls.push(URL.createObjectURL(blob));
      }
      setFrames(urls);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  function downloadOne(url: string, index: number) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `frame-${index + 1}.png`;
    a.click();
  }

  async function downloadAll() {
    if (!frames.length) return;
    setBusy(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (let i = 0; i < frames.length; i++) {
        const res = await fetch(frames[i]!);
        zip.file(`frame-${String(i + 1).padStart(3, "0")}.png`, await res.blob());
      }
      downloadBlob(await zip.generateAsync({ type: "blob" }), "frames.zip");
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    for (const url of frames) URL.revokeObjectURL(url);
    setFrames([]);
    revokeVideo(videoEl);
    setVideoEl(null);
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(null);
    setError("");
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
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
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">{labels.interval}</span>
        <input
          type="number"
          min={0.1}
          step={0.1}
          value={intervalSec}
          onChange={(e) => setIntervalSec(Number(e.target.value) || 1)}
          className="w-32 rounded-xl border border-slate-200 px-3 py-2"
          disabled={busy}
        />
      </label>
      {frames.length ? (
        <p className="text-sm text-slate-600">
          {labels.frameCount.replace("{count}", String(frames.length))}
        </p>
      ) : null}
      {frames.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {frames.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => downloadOne(url, i)}
              className="overflow-hidden rounded-xl border border-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={labels.frameAlt.replace("{n}", String(i + 1))}
                className="aspect-video w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void capture()}
          disabled={busy || !videoEl}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {busy ? labels.processing : labels.capture}
        </button>
        <button
          type="button"
          onClick={() => void downloadAll()}
          disabled={busy || !frames.length}
          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium disabled:opacity-40"
        >
          {labels.downloadAll}
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
        >
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
