/** Shared browser-side video helpers (no ffmpeg). */

export const MAX_GIF_DURATION_SEC = 8;
export const MAX_GIF_WIDTH = 480;
export const MAX_FRAME_EXTRACT = 60;

export function isVideoFile(file: File): boolean {
  return (
    file.type.startsWith("video/") ||
    /\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(file.name)
  );
}

export function loadVideoElement(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
    };

    video.onloadedmetadata = () => {
      cleanup();
      // Some browsers report Infinity until seeked
      if (!Number.isFinite(video.duration) || video.duration === 0) {
        const onSeek = () => {
          video.removeEventListener("seeked", onSeek);
          resolve(video);
        };
        video.addEventListener("seeked", onSeek);
        video.currentTime = 1e101;
        return;
      }
      resolve(video);
    };
    video.onerror = () => {
      cleanup();
      URL.revokeObjectURL(url);
      reject(new Error("video load failed"));
    };
  });
}

export function revokeVideo(video: HTMLVideoElement | null) {
  if (!video?.src) return;
  URL.revokeObjectURL(video.src);
  video.removeAttribute("src");
  video.load();
}

export function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error("seek failed"));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    const clamped = Math.min(Math.max(0, time), Math.max(0, video.duration - 0.001));
    if (Math.abs(video.currentTime - clamped) < 0.001) {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
      return;
    }
    video.currentTime = clamped;
  });
}

export function drawVideoFrame(
  video: HTMLVideoElement,
  maxWidth?: number,
): HTMLCanvasElement {
  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  let w = vw;
  let h = vh;
  if (maxWidth && w > maxWidth) {
    h = Math.round((vh / vw) * maxWidth);
    w = maxWidth;
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(video, 0, 0, w, h);
  return canvas;
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function pickRecorderMime(): string {
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
  return "video/webm";
}
