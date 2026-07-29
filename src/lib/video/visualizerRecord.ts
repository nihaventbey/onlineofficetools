import { pickRecorderMime, seekVideo } from "@/lib/files/video";
import {
  drawVisualizerFrame,
  type VisualizerDrawOptions,
} from "@/lib/video/visualizerDraw";

export const MAX_VIZ_DURATION_SEC = 5 * 60;

export type OutputPreset = {
  width: number;
  height: number;
};

export type RecordVisualizerOptions = {
  /** Audio-only or video+audio source element */
  media: HTMLAudioElement | HTMLVideoElement;
  isVideo: boolean;
  start: number;
  end: number;
  output: OutputPreset;
  draw: VisualizerDrawOptions;
  /** transparent overlay for editors vs burn onto video */
  compositeVideo: boolean;
  signal?: AbortSignal;
  onProgress?: (ratio: number) => void;
};

function even(n: number) {
  const v = Math.max(2, Math.floor(n));
  return v - (v % 2);
}

function pickAlphaFriendlyMime(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return pickRecorderMime();
}

export async function recordAudioVisualizer(
  options: RecordVisualizerOptions,
): Promise<Blob> {
  if (typeof MediaRecorder === "undefined") throw new Error("NO_RECORDER");

  const { media, isVideo, start, end, output, draw, compositeVideo, signal, onProgress } =
    options;
  const duration = end - start;
  if (duration <= 0) throw new Error("INVALID_RANGE");
  if (duration > MAX_VIZ_DURATION_SEC) throw new Error("TOO_LONG");

  const outW = even(output.width);
  const outH = even(output.height);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("canvas");

  const audioCtx = new AudioContext();
  await audioCtx.resume();
  const source = audioCtx.createMediaElementSource(media);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.75;
  const dest = audioCtx.createMediaStreamDestination();
  source.connect(analyser);
  analyser.connect(dest);

  const canvasStream = canvas.captureStream(30);
  const tracks = [...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()];
  const recordStream = new MediaStream(tracks);

  const mime = pickAlphaFriendlyMime();
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

  const videoEl = isVideo ? (media as HTMLVideoElement) : null;
  if (videoEl) {
    videoEl.muted = false;
    await seekVideo(videoEl, start);
  } else {
    const audioEl = media as HTMLAudioElement;
    await new Promise<void>((resolve, reject) => {
      const onSeeked = () => {
        audioEl.removeEventListener("seeked", onSeeked);
        audioEl.removeEventListener("error", onError);
        resolve();
      };
      const onError = () => {
        audioEl.removeEventListener("seeked", onSeeked);
        audioEl.removeEventListener("error", onError);
        reject(new Error("seek"));
      };
      audioEl.addEventListener("seeked", onSeeked);
      audioEl.addEventListener("error", onError);
      audioEl.currentTime = start;
    });
  }

  let raf = 0;
  const paint = () => {
    if (signal?.aborted) return;
    const bg =
      compositeVideo && videoEl
        ? draw.background
        : draw.background === "transparent"
          ? "transparent"
          : draw.background;
    drawVisualizerFrame(
      ctx,
      analyser,
      { ...draw, background: bg },
      compositeVideo ? videoEl : null,
    );
    const t = media.currentTime - start;
    if (duration > 0) onProgress?.(Math.min(1, Math.max(0, t / duration)));
    raf = requestAnimationFrame(paint);
  };

  recorder.start(100);
  paint();
  await media.play();

  await new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (signal?.aborted) {
        reject(new Error("ABORTED"));
        return;
      }
      if (media.currentTime >= end || media.ended) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });

  media.pause();
  cancelAnimationFrame(raf);
  drawVisualizerFrame(
    ctx,
    analyser,
    { ...draw, background: compositeVideo && videoEl ? draw.background : draw.background },
    compositeVideo ? videoEl : null,
  );

  if (recorder.state !== "inactive") recorder.stop();
  recordStream.getTracks().forEach((t) => t.stop());
  canvasStream.getTracks().forEach((t) => t.stop());
  source.disconnect();
  analyser.disconnect();
  await audioCtx.close().catch(() => undefined);

  onProgress?.(1);
  return done;
}
