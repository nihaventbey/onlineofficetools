"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob, MAX_VIDEO_BYTES } from "@/lib/files/utils";
import { isAudioFile, MAX_AUDIO_BYTES } from "@/lib/audio/operations";
import {
  isVideoFile,
  loadVideoElement,
  revokeVideo,
} from "@/lib/files/video";
import {
  drawVisualizerFrame,
  type VisualizerPlacement,
  type VisualizerStyle,
} from "@/lib/video/visualizerDraw";
import {
  MAX_VIZ_DURATION_SEC,
  recordAudioVisualizer,
  type OutputPreset,
} from "@/lib/video/visualizerRecord";
import { FileDropZone, ProgressBar } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["videoAudioVisualizer"] };

type ExportMode = "transparent" | "composite";

const PRESETS: { id: string; w: number; h: number }[] = [
  { id: "landscape1080", w: 1920, h: 1080 },
  { id: "landscape720", w: 1280, h: 720 },
  { id: "portrait", w: 1080, h: 1920 },
  { id: "square", w: 1080, h: 1080 },
];

const STYLES: VisualizerStyle[] = ["bars", "mirror", "wave", "circle", "line"];

function loadAudioElement(file: File): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "auto";
    audio.src = url;
    audio.onloadedmetadata = () => resolve(audio);
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("audio"));
    };
  });
}

function revokeAudio(audio: HTMLAudioElement | null) {
  if (!audio?.src) return;
  URL.revokeObjectURL(audio.src);
  audio.removeAttribute("src");
  audio.load();
}

export default function VideoAudioVisualizer({ labels }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [safariWarning, setSafariWarning] = useState(false);

  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [audioName, setAudioName] = useState("");
  const [videoName, setVideoName] = useState("");
  const audioFileRef = useRef<File | null>(null);
  const videoFileRef = useRef<File | null>(null);

  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);

  const [style, setStyle] = useState<VisualizerStyle>("bars");
  const [colorPrimary, setColorPrimary] = useState("#22d3ee");
  const [colorSecondary, setColorSecondary] = useState("#6366f1");
  const [gradient, setGradient] = useState(true);
  const [bgMode, setBgMode] = useState<"transparent" | "solid" | "chromaGreen" | "chromaMagenta">("chromaGreen");
  const [bgColor, setBgColor] = useState("#0f172a");
  const [placement, setPlacement] = useState<VisualizerPlacement>("bottom");
  const [bandHeight, setBandHeight] = useState(0.28);
  const [sensitivity, setSensitivity] = useState(1.2);
  const [presetId, setPresetId] = useState("landscape1080");
  const [exportMode, setExportMode] = useState<ExportMode>("transparent");
  const [previewing, setPreviewing] = useState(false);

  const previewRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const previewRafRef = useRef(0);
  const previewActiveRef = useRef(false);
  const abortRef = useRef(false);

  const hasMedia = Boolean(audioName || videoName);

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isSafari =
      /Safari/i.test(ua) && !/Chrome|Chromium|Edg|Firefox/i.test(ua);
    setSafariWarning(isSafari || typeof MediaRecorder === "undefined");
    return () => {
      abortRef.current = true;
      stopPreview();
      revokeAudio(audioEl);
      revokeVideo(videoEl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolvedBackground =
    bgMode === "transparent"
      ? "transparent"
      : bgMode === "chromaGreen"
        ? "#00ff00"
        : bgMode === "chromaMagenta"
          ? "#ff00ff"
          : bgColor;

  const drawOpts = useCallback(
    () => ({
      style,
      colorPrimary,
      colorSecondary,
      gradient,
      background: resolvedBackground,
      placement,
      bandHeight,
      sensitivity,
    }),
    [
      style,
      colorPrimary,
      colorSecondary,
      gradient,
      resolvedBackground,
      placement,
      bandHeight,
      sensitivity,
    ],
  );

  const paintPreview = useCallback(() => {
    const canvas = previewRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]!;
    const cssW = canvas.clientWidth || 640;
    const cssH = Math.round((cssW * preset.h) / preset.w);
    canvas.width = cssW;
    canvas.height = cssH;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    drawVisualizerFrame(
      ctx,
      analyser,
      drawOpts(),
      exportMode === "composite" ? videoEl : null,
    );
  }, [drawOpts, exportMode, presetId, videoEl]);

  function stopPreview() {
    previewActiveRef.current = false;
    cancelAnimationFrame(previewRafRef.current);
    previewRafRef.current = 0;
    setPreviewing(false);
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    audioEl?.pause();
    videoEl?.pause();
  }

  async function freshMediaForExport(): Promise<{
    media: HTMLAudioElement | HTMLVideoElement;
    cleanup: () => void;
  }> {
    const compositeVideo = exportMode === "composite" && videoFileRef.current;
    if (compositeVideo) {
      const video = await loadVideoElement(videoFileRef.current!);
      video.muted = false;
      return {
        media: video,
        cleanup: () => revokeVideo(video),
      };
    }
    if (audioFileRef.current) {
      const audio = await loadAudioElement(audioFileRef.current);
      return {
        media: audio,
        cleanup: () => revokeAudio(audio),
      };
    }
    if (videoFileRef.current) {
      const video = await loadVideoElement(videoFileRef.current);
      video.muted = false;
      return {
        media: video,
        cleanup: () => revokeVideo(video),
      };
    }
    throw new Error("NO_SOURCE");
  }

  async function freshMediaForPreview(): Promise<HTMLAudioElement | HTMLVideoElement> {
    if (exportMode === "composite" && videoFileRef.current) {
      revokeVideo(videoEl);
      const video = await loadVideoElement(videoFileRef.current);
      video.muted = false;
      setVideoEl(video);
      return video;
    }
    if (audioFileRef.current) {
      revokeAudio(audioEl);
      const audio = await loadAudioElement(audioFileRef.current);
      setAudioEl(audio);
      return audio;
    }
    if (videoFileRef.current) {
      revokeVideo(videoEl);
      const video = await loadVideoElement(videoFileRef.current);
      video.muted = false;
      setVideoEl(video);
      return video;
    }
    throw new Error("NO_SOURCE");
  }

  async function startPreview() {
    if (!hasMedia) return;
    stopPreview();
    let media: HTMLAudioElement | HTMLVideoElement;
    try {
      media = await freshMediaForPreview();
    } catch {
      setError(labels.needSource);
      return;
    }

    const ctx = new AudioContext();
    await ctx.resume();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaElementSource(media);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;

    media.currentTime = startTime;
    previewActiveRef.current = true;
    setPreviewing(true);
    await media.play();

    const loop = () => {
      if (!previewActiveRef.current || !analyserRef.current) return;
      paintPreview();
      if (media.currentTime >= endTime || media.ended) {
        media.pause();
        media.currentTime = startTime;
      }
      previewRafRef.current = requestAnimationFrame(loop);
    };
    previewRafRef.current = requestAnimationFrame(loop);
  }

  useEffect(() => {
    if (previewing) paintPreview();
  }, [paintPreview, previewing, style, colorPrimary, colorSecondary, gradient, bgMode, bgColor, placement, bandHeight, sensitivity, exportMode]);

  async function onAudioFile(file: File) {
    if (!isAudioFile(file)) {
      setError(labels.invalidAudio);
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    setError("");
    stopPreview();
    revokeAudio(audioEl);
    try {
      const audio = await loadAudioElement(file);
      const dur = Number.isFinite(audio.duration) ? audio.duration : 0;
      audioFileRef.current = file;
      setAudioEl(audio);
      setAudioName(file.name);
      setDuration(dur);
      setStartTime(0);
      setEndTime(Math.min(MAX_VIZ_DURATION_SEC, dur || 30));
      if (!videoEl) setExportMode("transparent");
    } catch {
      setError(labels.error);
    }
  }

  async function onVideoFile(file: File) {
    if (!isVideoFile(file)) {
      setError(labels.invalidVideo);
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    setError("");
    stopPreview();
    revokeVideo(videoEl);
    try {
      const video = await loadVideoElement(file);
      video.muted = false;
      const dur = Number.isFinite(video.duration) ? video.duration : 0;
      videoFileRef.current = file;
      setVideoEl(video);
      setVideoName(file.name);
      if (!audioEl) {
        setDuration(dur);
        setStartTime(0);
        setEndTime(Math.min(MAX_VIZ_DURATION_SEC, dur || 30));
      }
    } catch {
      setError(labels.error);
    }
  }

  function clearAll() {
    stopPreview();
    revokeAudio(audioEl);
    revokeVideo(videoEl);
    setAudioEl(null);
    setVideoEl(null);
    audioFileRef.current = null;
    videoFileRef.current = null;
    setAudioName("");
    setVideoName("");
    setDuration(0);
    setError("");
    setProgress(0);
  }

  async function run() {
    if (!hasMedia) {
      setError(labels.needSource);
      return;
    }
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
    if (end - start > MAX_VIZ_DURATION_SEC) {
      setError(labels.tooLong);
      return;
    }

    setBusy(true);
    setError("");
    setProgress(0);
    abortRef.current = false;
    stopPreview();

    const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]!;
    const output: OutputPreset = { width: preset.w, height: preset.h };
    const compositeVideo = exportMode === "composite" && Boolean(videoFileRef.current);

    let cleanup: (() => void) | undefined;
    try {
      const { media, cleanup: c } = await freshMediaForExport();
      cleanup = c;

      const blob = await recordAudioVisualizer({
        media,
        isVideo: media instanceof HTMLVideoElement,
        start,
        end,
        output,
        draw: drawOpts(),
        compositeVideo,
        onProgress: setProgress,
      });
      downloadBlob(blob, `audio-visualizer-${Date.now()}.webm`);
    } catch (e) {
      if (e instanceof Error && e.message === "TOO_LONG") setError(labels.tooLong);
      else if (e instanceof Error && e.message === "NO_RECORDER") setError(labels.safariWarning);
      else setError(labels.error);
    } finally {
      cleanup?.();
      setBusy(false);
      setProgress(0);
    }
  }

  const styleLabels: Record<VisualizerStyle, string> = {
    bars: labels.styleBars,
    mirror: labels.styleMirror,
    wave: labels.styleWave,
    circle: labels.styleCircle,
    line: labels.styleLine,
  };

  const presetLabels: Record<string, string> = {
    landscape1080: labels.presetLandscape1080,
    landscape720: labels.presetLandscape720,
    portrait: labels.presetPortrait,
    square: labels.presetSquare,
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      {safariWarning ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {labels.safariWarning}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">{labels.audioSource}</p>
          <FileDropZone
            accept="audio/*"
            dropHint={labels.audioDropHint}
            selectHint={labels.audioSelectHint}
            onFiles={(f) => void onAudioFile(f[0]!)}
            disabled={busy}
          />
          {audioName ? (
            <p className="mt-2 text-sm text-slate-600">{audioName}</p>
          ) : null}
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">{labels.videoSourceOptional}</p>
          <FileDropZone
            accept="video/*"
            dropHint={labels.videoDropHint}
            selectHint={labels.videoSelectHint}
            onFiles={(f) => void onVideoFile(f[0]!)}
            disabled={busy}
          />
          {videoName ? (
            <p className="mt-2 text-sm text-slate-600">{videoName}</p>
          ) : null}
        </div>
      </div>

      {videoEl ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">{labels.exportMode}</legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setExportMode("transparent")}
              disabled={busy}
              className={`min-h-10 rounded-xl px-3 text-sm font-medium ${
                exportMode === "transparent"
                  ? "bg-violet-600 text-white"
                  : "border border-slate-200"
              }`}
            >
              {labels.modeTransparent}
            </button>
            <button
              type="button"
              onClick={() => setExportMode("composite")}
              disabled={busy}
              className={`min-h-10 rounded-xl px-3 text-sm font-medium ${
                exportMode === "composite"
                  ? "bg-violet-600 text-white"
                  : "border border-slate-200"
              }`}
            >
              {labels.modeComposite}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">{labels.transparentHint}</p>
        </fieldset>
      ) : null}

      {hasMedia ? (
        <>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{labels.preview}</p>
            <canvas
              ref={previewRef}
              className="w-full max-w-3xl rounded-xl border border-slate-200 bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]"
              style={{ aspectRatio: `${PRESETS.find((p) => p.id === presetId)?.w ?? 16} / ${PRESETS.find((p) => p.id === presetId)?.h ?? 9}` }}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void startPreview()}
                disabled={busy || previewing}
                className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium"
              >
                {labels.previewPlay}
              </button>
              <button
                type="button"
                onClick={stopPreview}
                disabled={!previewing}
                className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium"
              >
                {labels.previewStop}
              </button>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">{labels.styleLabel}</legend>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  disabled={busy}
                  className={`min-h-10 rounded-xl px-3 text-sm font-medium ${
                    style === s ? "bg-violet-600 text-white" : "border border-slate-200"
                  }`}
                >
                  {styleLabels[s]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">{labels.colorPrimary}</span>
              <input
                type="color"
                value={colorPrimary}
                onChange={(e) => setColorPrimary(e.target.value)}
                disabled={busy}
                className="h-11 w-full cursor-pointer rounded-xl border border-slate-200"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">{labels.colorSecondary}</span>
              <input
                type="color"
                value={colorSecondary}
                onChange={(e) => setColorSecondary(e.target.value)}
                disabled={busy}
                className="h-11 w-full cursor-pointer rounded-xl border border-slate-200"
              />
            </label>
            <label className="flex items-center gap-2 self-end text-sm">
              <input
                type="checkbox"
                checked={gradient}
                onChange={(e) => setGradient(e.target.checked)}
                disabled={busy}
              />
              {labels.gradient}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">{labels.backgroundMode}</span>
              <select
                value={bgMode}
                onChange={(e) =>
                  setBgMode(
                    e.target.value as
                      | "transparent"
                      | "solid"
                      | "chromaGreen"
                      | "chromaMagenta",
                  )
                }
                disabled={busy || (exportMode === "composite" && Boolean(videoEl))}
                className="min-h-11 w-full rounded-xl border border-slate-200 px-3"
              >
                <option value="chromaGreen">{labels.bgChromaGreen}</option>
                <option value="chromaMagenta">{labels.bgChromaMagenta}</option>
                <option value="transparent">{labels.transparentBackground}</option>
                <option value="solid">{labels.backgroundColor}</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">{labels.chromaHint}</p>
            </label>
            {bgMode === "solid" ? (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">{labels.backgroundColor}</span>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  disabled={busy}
                  className="h-11 w-full cursor-pointer rounded-xl border border-slate-200"
                />
              </label>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">{labels.placement}</span>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value as VisualizerPlacement)}
                disabled={busy}
                className="min-h-11 w-full rounded-xl border border-slate-200 px-3"
              >
                <option value="bottom">{labels.placementBottom}</option>
                <option value="center">{labels.placementCenter}</option>
                <option value="full">{labels.placementFull}</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 flex justify-between font-medium text-slate-700">
                <span>{labels.sensitivity}</span>
                <span className="tabular-nums text-slate-500">{sensitivity.toFixed(1)}</span>
              </span>
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.1}
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                disabled={busy}
                className="w-full"
              />
            </label>
            {placement === "bottom" ? (
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 flex justify-between font-medium text-slate-700">
                  <span>{labels.bandHeight}</span>
                  <span className="tabular-nums text-slate-500">{Math.round(bandHeight * 100)}%</span>
                </span>
                <input
                  type="range"
                  min={0.15}
                  max={0.6}
                  step={0.01}
                  value={bandHeight}
                  onChange={(e) => setBandHeight(Number(e.target.value))}
                  disabled={busy}
                  className="w-full"
                />
              </label>
            ) : null}
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">{labels.outputSize}</legend>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetId(p.id)}
                  disabled={busy}
                  className={`min-h-10 rounded-xl px-3 text-sm font-medium ${
                    presetId === p.id ? "bg-violet-600 text-white" : "border border-slate-200"
                  }`}
                >
                  {presetLabels[p.id]} ({p.w}×{p.h})
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-600">
              {labels.startTime}
              <input
                type="number"
                min={0}
                max={duration}
                step={0.1}
                value={startTime}
                onChange={(e) => setStartTime(Number(e.target.value))}
                disabled={busy}
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
              />
            </label>
            <label className="text-sm text-slate-600">
              {labels.endTime}
              <input
                type="number"
                min={0}
                max={duration}
                step={0.1}
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value))}
                disabled={busy}
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
              />
            </label>
          </div>
          {duration > 0 ? (
            <p className="text-sm text-slate-500">
              {labels.duration}: {duration.toFixed(1)}s
            </p>
          ) : null}
        </>
      ) : null}

      {busy ? <ProgressBar value={Math.round(progress * 100)} label={labels.processing} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={!hasMedia || busy}
          className="min-h-11 rounded-xl bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
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
    </div>
  );
}
