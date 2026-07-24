"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob, formatBytes } from "@/lib/files/utils";
import {
  computePeaks,
  decodeAudioFile,
  exportAudio,
  formatDuration,
  isAudioFile,
  isOggExportSupported,
  MAX_AUDIO_BYTES,
  sliceAudioBuffer,
  type AudioExportFormat,
} from "@/lib/audio/operations";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["audioEditor"] };

export default function AudioEditor({ labels }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [format, setFormat] = useState<AudioExportFormat>("wav");
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [safariNote, setSafariNote] = useState(false);
  const [oggOk, setOggOk] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const rafRef = useRef(0);
  const playStartedAtRef = useRef(0);
  const playOffsetRef = useRef(0);

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isSafari =
      /Safari/i.test(ua) && !/Chrome|Chromium|Edg|Firefox/i.test(ua);
    setSafariNote(isSafari || typeof MediaRecorder === "undefined");
    setOggOk(isOggExportSupported());
    return () => {
      stopPlayback();
      if (playCtxRef.current) {
        void playCtxRef.current.close().catch(() => undefined);
        playCtxRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks || !duration) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 640;
    const cssH = canvas.clientHeight || 120;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, cssW, cssH);

    const mid = cssH / 2;
    const barW = cssW / peaks.length;
    const startX = (startTime / duration) * cssW;
    const endX = (endTime / duration) * cssW;

    ctx.fillStyle = "rgba(14, 165, 233, 0.18)";
    ctx.fillRect(startX, 0, Math.max(1, endX - startX), cssH);

    for (let i = 0; i < peaks.length; i++) {
      const x = i * barW;
      const inSel = x >= startX && x <= endX;
      const h = Math.max(1, (peaks[i] ?? 0) * (cssH * 0.9));
      ctx.fillStyle = inSel ? "#0284c7" : "#94a3b8";
      ctx.fillRect(x, mid - h / 2, Math.max(1, barW * 0.7), h);
    }

    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, cssH);
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, cssH);
    ctx.stroke();

    if (playing || playhead > 0) {
      const px = (playhead / duration) * cssW;
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, cssH);
      ctx.stroke();
    }
  }, [peaks, duration, startTime, endTime, playhead, playing]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  useEffect(() => {
    const onResize = () => drawWaveform();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [drawWaveform]);

  function stopPlayback() {
    cancelAnimationFrame(rafRef.current);
    try {
      sourceRef.current?.stop();
    } catch {
      /* ignore */
    }
    sourceRef.current = null;
    setPlaying(false);
  }

  function tickPlayhead() {
    if (!playing) return;
    const elapsed = (performance.now() - playStartedAtRef.current) / 1000;
    const t = playOffsetRef.current + elapsed;
    if (t >= endTime) {
      setPlayhead(endTime);
      stopPlayback();
      return;
    }
    setPlayhead(t);
    rafRef.current = requestAnimationFrame(tickPlayhead);
  }

  async function ensurePlayCtx() {
    if (!playCtxRef.current) {
      playCtxRef.current = new AudioContext();
    }
    if (playCtxRef.current.state === "suspended") {
      await playCtxRef.current.resume();
    }
    return playCtxRef.current;
  }

  async function togglePlay() {
    if (!buffer || endTime <= startTime) return;
    if (playing) {
      stopPlayback();
      return;
    }
    try {
      const ctx = await ensurePlayCtx();
      stopPlayback();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      const offset = Math.min(Math.max(playhead, startTime), endTime - 0.01);
      const remaining = Math.max(0.01, endTime - offset);
      source.start(0, offset, remaining);
      source.onended = () => {
        setPlaying(false);
        setPlayhead(endTime);
      };
      sourceRef.current = source;
      playOffsetRef.current = offset;
      playStartedAtRef.current = performance.now();
      setPlaying(true);
      setPlayhead(offset);
      rafRef.current = requestAnimationFrame(tickPlayhead);
    } catch {
      setError(labels.error);
    }
  }

  async function onFile(file: File) {
    if (!isAudioFile(file)) {
      setError(labels.invalidFile);
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    setBusy(true);
    setError("");
    stopPlayback();
    setPlayhead(0);
    try {
      const decoded = await decodeAudioFile(file);
      const dur = decoded.duration;
      setBuffer(decoded);
      setPeaks(computePeaks(decoded));
      setDuration(dur);
      setStartTime(0);
      setEndTime(dur);
      setFileName(file.name);
      setFileSize(file.size);
      setProgress(0);
    } catch {
      setError(labels.decodeError);
      setBuffer(null);
      setPeaks(null);
    } finally {
      setBusy(false);
    }
  }

  function clampRange(nextStart: number, nextEnd: number) {
    const s = Math.max(0, Math.min(nextStart, duration));
    const e = Math.max(0, Math.min(nextEnd, duration));
    if (e <= s) {
      setStartTime(s);
      setEndTime(Math.min(duration, s + 0.05));
    } else {
      setStartTime(s);
      setEndTime(e);
    }
  }

  function onWavePointer(clientX: number, mode: "start" | "end" | "nearest") {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const t = ratio * duration;
    if (mode === "start") {
      clampRange(t, endTime);
    } else if (mode === "end") {
      clampRange(startTime, t);
    } else {
      const mid = (startTime + endTime) / 2;
      if (t < mid) clampRange(t, endTime);
      else clampRange(startTime, t);
    }
    setPlayhead(t);
  }

  async function runExport() {
    if (!buffer) return;
    if (endTime <= startTime) {
      setError(labels.error);
      return;
    }
    if (
      (format === "webm" || format === "ogg") &&
      typeof MediaRecorder === "undefined"
    ) {
      setError(labels.webmUnsupported);
      return;
    }
    if (format === "ogg" && !isOggExportSupported()) {
      setError(labels.oggUnsupported);
      return;
    }
    setBusy(true);
    setError("");
    setProgress(0);
    stopPlayback();
    try {
      const sliced = sliceAudioBuffer(buffer, startTime, endTime);
      const { blob, extension } = await exportAudio(sliced, format, setProgress);
      const base = fileName.replace(/\.[^.]+$/, "") || "audio";
      downloadBlob(blob, `${base}-edit.${extension}`);
    } catch {
      if (format === "ogg") setError(labels.oggUnsupported);
      else if (format === "webm") setError(labels.webmUnsupported);
      else setError(labels.error);
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  function clearAll() {
    stopPlayback();
    setBuffer(null);
    setPeaks(null);
    setDuration(0);
    setStartTime(0);
    setEndTime(0);
    setFileName("");
    setFileSize(0);
    setError("");
    setPlayhead(0);
    setProgress(0);
  }

  const selectionLen = Math.max(0, endTime - startTime);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      {safariNote && (format === "webm" || format === "ogg") ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {labels.safariWarning}
        </p>
      ) : null}

      {!buffer ? (
        <FileDropZone
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm,.opus"
          dropHint={labels.dropHint}
          selectHint={labels.selectHint ?? ""}
          onFiles={(files) => void onFile(files[0]!)}
          disabled={busy}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span className="truncate font-medium">{fileName}</span>
          <span className="text-slate-500">
            {formatBytes(fileSize)} · {formatDuration(duration)}
          </span>
        </div>
      )}

      {peaks ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">{labels.waveform}</p>
          <canvas
            ref={canvasRef}
            className="h-28 w-full cursor-ew-resize rounded-xl border border-slate-200 bg-slate-50 touch-none"
            onPointerDown={(e) => {
              (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
              onWavePointer(e.clientX, "nearest");
            }}
            onPointerMove={(e) => {
              if (e.buttons !== 1) return;
              onWavePointer(e.clientX, "nearest");
            }}
          />
          <p className="text-xs text-slate-500">{labels.waveformHint}</p>
        </div>
      ) : null}

      {buffer ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                {labels.startTime}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.01}
                value={startTime}
                onChange={(e) =>
                  clampRange(Number(e.target.value), endTime)
                }
                className="w-full"
                disabled={busy}
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={Number(startTime.toFixed(2))}
                onChange={(e) =>
                  clampRange(Number(e.target.value) || 0, endTime)
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                disabled={busy}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                {labels.endTime}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.01}
                value={endTime}
                onChange={(e) =>
                  clampRange(startTime, Number(e.target.value))
                }
                className="w-full"
                disabled={busy}
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={Number(endTime.toFixed(2))}
                onChange={(e) =>
                  clampRange(startTime, Number(e.target.value) || 0)
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                disabled={busy}
              />
            </label>
          </div>

          <p className="text-sm text-slate-600">
            {labels.selection}: {formatDuration(selectionLen)} (
            {selectionLen.toFixed(2)}s)
          </p>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">
              {labels.formatLabel}
            </legend>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="audio-format"
                  checked={format === "wav"}
                  onChange={() => setFormat("wav")}
                  disabled={busy}
                />
                {labels.formatWav}
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="audio-format"
                  checked={format === "mp3"}
                  onChange={() => setFormat("mp3")}
                  disabled={busy}
                />
                {labels.formatMp3}
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="audio-format"
                  checked={format === "webm"}
                  onChange={() => setFormat("webm")}
                  disabled={busy}
                />
                {labels.formatWebm}
              </label>
              {oggOk ? (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="audio-format"
                    checked={format === "ogg"}
                    onChange={() => setFormat("ogg")}
                    disabled={busy}
                  />
                  {labels.formatOgg}
                </label>
              ) : null}
            </div>
            <p className="text-xs text-slate-500">{labels.formatHint}</p>
          </fieldset>

          {busy && progress > 0 && format !== "wav" ? (
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-sky-500 transition-[width]"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void togglePlay()}
              disabled={busy}
              className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
            >
              {playing ? labels.pause : labels.play}
            </button>
            <button
              type="button"
              onClick={() => void runExport()}
              disabled={busy || selectionLen <= 0}
              className="min-h-11 rounded-xl bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-40"
            >
              {busy ? labels.processing : labels.download}
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={busy}
              className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
            >
              {labels.clear}
            </button>
          </div>
        </>
      ) : null}

      {error && !buffer ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
