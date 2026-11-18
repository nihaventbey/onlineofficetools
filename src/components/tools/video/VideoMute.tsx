"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob, formatBytes, MAX_VIDEO_BYTES } from "@/lib/files/utils";
import {
  isVideoFile,
  loadVideoElement,
  pickRecorderMime,
  revokeVideo,
} from "@/lib/files/video";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";
import { useClipboardPaste } from "@/lib/hooks/useClipboardPaste";

type Props = {
  labels: Dictionary["tools"]["videoMute"];
};

export default function VideoMute({ labels }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [busy, setBusy] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [mutedBlob, setMutedBlob] = useState<Blob | null>(null);
  const [mutedSrc, setMutedSrc] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [safariWarning, setSafariWarning] = useState<boolean>(false);

  const abortRef = useRef<boolean>(false);

  useClipboardPaste({
    onFiles: (files) => {
      const vid = files.find((f) => isVideoFile(f));
      if (vid) void handleFile(vid);
    },
    accept: "video/*",
    disabled: busy,
  });

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isSafari =
      /Safari/i.test(ua) && !/Chrome|Chromium|Edg|Firefox/i.test(ua);
    setSafariWarning(isSafari || typeof MediaRecorder === "undefined");

    return () => {
      abortRef.current = true;
      revokeVideo(videoEl);
      if (previewSrc) URL.revokeObjectURL(previewSrc);
      if (mutedSrc) URL.revokeObjectURL(mutedSrc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFile(selectedFile: File) {
    if (!isVideoFile(selectedFile)) {
      setError(labels.invalidFile || "Please select a valid video file.");
      return;
    }
    if (selectedFile.size > MAX_VIDEO_BYTES) {
      setError(labels.tooLarge || "Video file exceeds maximum size limit.");
      return;
    }

    setBusy(true);
    setError("");
    setMutedBlob(null);
    if (mutedSrc) URL.revokeObjectURL(mutedSrc);
    setMutedSrc(null);
    revokeVideo(videoEl);
    if (previewSrc) URL.revokeObjectURL(previewSrc);

    try {
      const video = await loadVideoElement(selectedFile);
      const dur = Number.isFinite(video.duration) ? video.duration : 0;
      setVideoEl(video);
      setPreviewSrc(video.src);
      setDuration(dur);
      setFile(selectedFile);
    } catch {
      setError(labels.loadError || "Could not read or decode video file.");
    } finally {
      setBusy(false);
    }
  }

  async function processMute() {
    if (!videoEl || !file) return;

    setBusy(true);
    setProgress(0);
    setError("");
    abortRef.current = false;

    try {
      videoEl.currentTime = 0;
      await new Promise<void>((resolve) => {
        videoEl.onseeked = () => resolve();
      });

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
        setError(labels.unsupportedBrowser || "Browser video capture stream not supported.");
        return;
      }

      // Drop all audio tracks completely!
      const recordStream = new MediaStream(stream.getVideoTracks());

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

      const totalDur = duration || videoEl.duration || 1;
      await new Promise<void>((resolve) => {
        const tick = () => {
          if (abortRef.current || videoEl.currentTime >= totalDur || videoEl.ended) {
            videoEl.pause();
            resolve();
            return;
          }
          const pct = Math.min(100, Math.round((videoEl.currentTime / totalDur) * 100));
          setProgress(pct);
          requestAnimationFrame(tick);
        };
        tick();
      });

      if (recorder.state !== "inactive") recorder.stop();
      stream.getTracks().forEach((t) => t.stop());

      const blob = await done;
      if (!abortRef.current) {
        setMutedBlob(blob);
        const url = URL.createObjectURL(blob);
        setMutedSrc(url);
        setProgress(100);
      }
    } catch {
      setError(labels.processError || "An error occurred while removing audio track.");
    } finally {
      setBusy(false);
      try {
        videoEl.pause();
      } catch {
        /* ignore */
      }
    }
  }

  function downloadMuted() {
    if (!mutedBlob || !file) return;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    downloadBlob(mutedBlob, `${baseName}-muted.webm`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between rounded-xl bg-indigo-50/70 border border-indigo-100 px-3.5 py-2.5 text-xs text-indigo-900">
          <span>💡 Need to trim duration, crop aspect ratios, or scale resolution as well? Try the all-in-one <strong>Video Quick Studio</strong>.</span>
          <a href="video-trim" className="font-semibold text-indigo-600 hover:underline shrink-0 ml-2">Open Video Studio →</a>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {labels.muteTitle || "Mute Video (Remove Audio Track)"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {labels.muteDescription ||
              "Strip background audio or copyrighted music directly in your browser. 100% private, no server upload."}
          </p>
        </div>

        {safariWarning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            {labels.safariHint ||
              "Note: Some Safari versions have limited MediaRecorder support. For the fastest processing, Chrome, Edge or Firefox is recommended."}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {!file ? (
          <FileDropZone
            accept="video/*,.mp4,.webm,.mov,.m4v"
            dropHint={labels.dropHint || "Drag and drop a video here, or click to browse"}
            selectHint={labels.selectHint || "Supports MP4, WebM, MOV (Max 200MB)"}
            onFiles={(files) => void handleFile(files[0]!)}
            disabled={busy}
          />
        ) : (
          <div className="space-y-6">
            {/* File info card */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎬</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 truncate max-w-sm">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(file.size)} • {duration ? `${duration.toFixed(1)}s` : "Unknown duration"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setMutedBlob(null);
                  setPreviewSrc(null);
                }}
                disabled={busy}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                {labels.changeVideo || "Change Video"}
              </button>
            </div>

            {/* Preview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  🔊 {labels.originalVideo || "Original Video (With Audio)"}
                </span>
                {previewSrc && (
                  <video
                    src={previewSrc}
                    controls
                    playsInline
                    className="aspect-video w-full rounded-xl bg-black object-contain shadow-sm"
                  />
                )}
              </div>

              {/* Muted Result */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  🔇 {labels.mutedResult || "Muted Preview (No Audio)"}
                </span>
                {mutedSrc ? (
                  <video
                    src={mutedSrc}
                    controls
                    playsInline
                    className="aspect-video w-full rounded-xl bg-black object-contain shadow-sm"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center aspect-video w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-center p-4">
                    <span className="text-3xl mb-1">🔇</span>
                    <p className="text-xs font-medium">
                      {labels.readyToMute || "Click below to remove audio"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action & Progress */}
            {busy && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>{labels.processing || "Muting video in browser..."}</span>
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

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              {!mutedBlob ? (
                <button
                  type="button"
                  onClick={processMute}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  🔇 {busy ? labels.processingBtn || "Muting..." : labels.muteAction || "Remove Audio"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={downloadMuted}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  ⬇ {labels.downloadMuted || "Download Muted Video (.webm)"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
