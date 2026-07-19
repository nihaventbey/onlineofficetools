"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { formatBytes, MAX_VIDEO_BYTES } from "@/lib/files/utils";
import {
  gcd,
  isVideoFile,
  loadVideoElement,
  revokeVideo,
  seekVideo,
} from "@/lib/files/video";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["videoInfo"] };

type Info = {
  duration: string;
  resolution: string;
  aspectRatio: string;
  estimatedFps: string;
  hasAudio: string;
  fileSize: string;
  mimeType: string;
};

export default function VideoInfo({ labels }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<Info | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewSrc) URL.revokeObjectURL(previewSrc);
    };
  }, [previewSrc]);

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
    setInfo(null);
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    let video: HTMLVideoElement | null = null;
    try {
      video = await loadVideoElement(file);
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;
      const dur = Number.isFinite(video.duration) ? video.duration : 0;
      const g = gcd(w, h);
      let estimatedFps = labels.unknown;
      try {
        // Sample a short window to estimate fps via requestVideoFrameCallback if available
        const v = video as HTMLVideoElement & {
          requestVideoFrameCallback?: (
            cb: (now: number, meta: { mediaTime: number }) => void,
          ) => number;
        };
        if (typeof v.requestVideoFrameCallback === "function") {
          await seekVideo(video, Math.min(0.5, Math.max(0, dur / 4)));
          await video.play();
          const times: number[] = [];
          await new Promise<void>((resolve) => {
            const collect = (_now: number, meta: { mediaTime: number }) => {
              times.push(meta.mediaTime);
              if (times.length >= 8 || times.length > 0 && meta.mediaTime - times[0]! > 0.5) {
                video!.pause();
                resolve();
                return;
              }
              v.requestVideoFrameCallback!(collect);
            };
            v.requestVideoFrameCallback!(collect);
            setTimeout(() => {
              video!.pause();
              resolve();
            }, 800);
          });
          if (times.length >= 2) {
            const deltas: number[] = [];
            for (let i = 1; i < times.length; i++) {
              const d = times[i]! - times[i - 1]!;
              if (d > 0.001) deltas.push(d);
            }
            if (deltas.length) {
              const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
              estimatedFps = `${Math.round(1 / avg)}`;
            }
          }
        }
      } catch {
        /* keep unknown */
      }

      let hasAudio = labels.unknown;
      try {
        // Best-effort: captureStream audio tracks, or mozHasAudio / audioTracks
        const anyVid = video as HTMLVideoElement & {
          mozHasAudio?: boolean;
          audioTracks?: { length: number };
          captureStream?: () => MediaStream;
        };
        if (typeof anyVid.mozHasAudio === "boolean") {
          hasAudio = anyVid.mozHasAudio ? labels.yes : labels.no;
        } else if (anyVid.audioTracks) {
          hasAudio = anyVid.audioTracks.length > 0 ? labels.yes : labels.no;
        } else if (typeof anyVid.captureStream === "function") {
          const stream = anyVid.captureStream();
          hasAudio = stream.getAudioTracks().length > 0 ? labels.yes : labels.no;
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch {
        /* keep unknown */
      }

      setInfo({
        duration: dur ? `${dur.toFixed(2)}s` : labels.unknown,
        resolution: w && h ? `${w} × ${h}` : labels.unknown,
        aspectRatio: w && h ? `${w / g}:${h / g}` : labels.unknown,
        estimatedFps,
        hasAudio,
        fileSize: formatBytes(file.size),
        mimeType: file.type || labels.unknown,
      });
      setPreviewSrc(video.src);
    } catch {
      setError(labels.error);
      revokeVideo(video);
    } finally {
      setBusy(false);
    }
  }

  const rows: { label: string; value: string }[] = info
    ? [
        { label: labels.duration, value: info.duration },
        { label: labels.resolution, value: info.resolution },
        { label: labels.aspectRatio, value: info.aspectRatio },
        { label: labels.estimatedFps, value: info.estimatedFps },
        { label: labels.hasAudio, value: info.hasAudio },
        { label: labels.fileSize, value: info.fileSize },
        { label: labels.mimeType, value: info.mimeType },
      ]
    : [];

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
      {busy ? <p className="text-sm text-slate-500">{labels.processing}</p> : null}
      {rows.length ? (
        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5 text-sm"
            >
              <dt className="font-medium text-slate-600">{row.label}</dt>
              <dd className="text-slate-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={() => {
          setInfo(null);
          if (previewSrc) URL.revokeObjectURL(previewSrc);
          setPreviewSrc(null);
          setError("");
        }}
        className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
      >
        {labels.clear}
      </button>
    </div>
  );
}
