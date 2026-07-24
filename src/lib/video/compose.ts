import {
  applyWatermarkToCanvas,
  type StampSource,
} from "@/lib/watermark/draw";
import type { WatermarkOptions } from "@/lib/watermark/types";
import { pickRecorderMime, seekVideo } from "@/lib/files/video";

/** Source crop rectangle in original video pixels. */
export type VideoCropRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export const MAX_COMPOSE_DURATION_SEC = 5 * 60;
export const MAX_COMPOSE_WIDTH = 1280;

export type ComposeRecordOptions = {
  video: HTMLVideoElement;
  start: number;
  end: number;
  crop?: VideoCropRect;
  watermark?: WatermarkOptions;
  stampBitmap?: ImageBitmap | null;
  mute?: boolean;
  maxWidth?: number;
  /** Force exact output size (social presets). Crop is scaled to fill. */
  outputSize?: { width: number; height: number };
  signal?: AbortSignal;
  onProgress?: (ratio: number) => void;
};

function captureVideoStream(video: HTMLVideoElement): MediaStream | null {
  const v = video as HTMLVideoElement & {
    captureStream?: (fps?: number) => MediaStream;
    mozCaptureStream?: (fps?: number) => MediaStream;
  };
  return v.captureStream?.(30) ?? v.mozCaptureStream?.(30) ?? null;
}

function resolveOutputSize(
  video: HTMLVideoElement,
  crop: VideoCropRect | undefined,
  maxWidth: number,
  outputSize?: { width: number; height: number },
): { outW: number; outH: number; sx: number; sy: number; sw: number; sh: number } {
  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  const sx = crop ? Math.max(0, Math.floor(crop.x)) : 0;
  const sy = crop ? Math.max(0, Math.floor(crop.y)) : 0;
  const sw = crop
    ? Math.max(1, Math.min(Math.floor(crop.w), vw - sx))
    : vw;
  const sh = crop
    ? Math.max(1, Math.min(Math.floor(crop.h), vh - sy))
    : vh;

  if (outputSize) {
    let outW = Math.max(2, Math.floor(outputSize.width));
    let outH = Math.max(2, Math.floor(outputSize.height));
    outW = outW - (outW % 2);
    outH = outH - (outH % 2);
    return { outW, outH, sx, sy, sw, sh };
  }

  let outW = sw;
  let outH = sh;
  if (outW > maxWidth) {
    outH = Math.round((sh / sw) * maxWidth);
    outW = maxWidth;
  }
  outW = Math.max(2, outW - (outW % 2));
  outH = Math.max(2, outH - (outH % 2));
  return { outW, outH, sx, sy, sw, sh };
}

function drawComposeFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  geom: ReturnType<typeof resolveOutputSize>,
  watermark?: WatermarkOptions,
  stampBitmap?: ImageBitmap | null,
) {
  const { outW, outH, sx, sy, sw, sh } = geom;
  ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH);
  if (!watermark) return;
  let source: StampSource;
  if (watermark.mode === "image") {
    if (!stampBitmap) return;
    source = { kind: "image", bitmap: stampBitmap };
  } else {
    source = {
      kind: "text",
      text: watermark.text.trim() || " ",
      fontId: watermark.fontId,
      color: watermark.color,
    };
  }
  applyWatermarkToCanvas(ctx.canvas, watermark, source);
}

/** Draw a single preview frame (seek first if needed). */
export function paintComposePreview(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  options: {
    crop?: VideoCropRect;
    watermark?: WatermarkOptions;
    stampBitmap?: ImageBitmap | null;
    maxWidth?: number;
    outputSize?: { width: number; height: number };
  },
) {
  const geom = resolveOutputSize(
    video,
    options.crop,
    options.maxWidth ?? MAX_COMPOSE_WIDTH,
    options.outputSize,
  );
  canvas.width = geom.outW;
  canvas.height = geom.outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  drawComposeFrame(ctx, video, geom, options.watermark, options.stampBitmap);
}

/**
 * Re-encode a video segment through canvas (crop + watermark) → WebM.
 * Plays in real time; duration ≈ wall-clock of the selected range.
 */
export async function composeAndRecord(
  options: ComposeRecordOptions,
): Promise<Blob> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("NO_RECORDER");
  }
  const {
    video,
    mute = false,
    maxWidth = MAX_COMPOSE_WIDTH,
    outputSize,
    signal,
    onProgress,
  } = options;
  const start = Math.max(0, options.start);
  const end = Math.min(
    Number.isFinite(video.duration) ? video.duration : options.end,
    options.end,
  );
  if (end <= start) throw new Error("INVALID_RANGE");
  if (end - start > MAX_COMPOSE_DURATION_SEC) throw new Error("TOO_LONG");

  const geom = resolveOutputSize(video, options.crop, maxWidth, outputSize);
  const canvas = document.createElement("canvas");
  canvas.width = geom.outW;
  canvas.height = geom.outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  await seekVideo(video, start);
  video.muted = mute;

  const canvasStream = canvas.captureStream(30);
  const videoCapture = captureVideoStream(video);
  let recordStream: MediaStream = canvasStream;

  if (!mute && videoCapture) {
    const audioTracks = videoCapture.getAudioTracks();
    if (audioTracks.length) {
      recordStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTracks,
      ]);
    }
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

  let raf = 0;
  const paint = () => {
    if (signal?.aborted) return;
    drawComposeFrame(
      ctx,
      video,
      geom,
      options.watermark,
      options.stampBitmap,
    );
    const span = end - start;
    if (span > 0) {
      onProgress?.(Math.min(1, Math.max(0, (video.currentTime - start) / span)));
    }
    raf = requestAnimationFrame(paint);
  };

  recorder.start(100);
  paint();
  await video.play();

  await new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (signal?.aborted) {
        reject(new Error("ABORTED"));
        return;
      }
      if (video.currentTime >= end || video.ended) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });

  video.pause();
  cancelAnimationFrame(raf);
  // Final frame
  drawComposeFrame(
    ctx,
    video,
    geom,
    options.watermark,
    options.stampBitmap,
  );

  if (recorder.state !== "inactive") recorder.stop();
  recordStream.getTracks().forEach((t) => t.stop());
  canvasStream.getTracks().forEach((t) => t.stop());
  videoCapture?.getTracks().forEach((t) => t.stop());

  onProgress?.(1);
  return done;
}

/** Centered crop rect for a target aspect ratio (width/height). */
export function centeredCropForAspect(
  videoW: number,
  videoH: number,
  aspect: number,
): VideoCropRect {
  const srcAspect = videoW / Math.max(1, videoH);
  if (srcAspect > aspect) {
    const w = Math.floor(videoH * aspect);
    const x = Math.floor((videoW - w) / 2);
    return { x, y: 0, w, h: videoH };
  }
  const h = Math.floor(videoW / aspect);
  const y = Math.floor((videoH - h) / 2);
  return { x: 0, y, w: videoW, h };
}
