export type VisualizerStyle = "bars" | "mirror" | "wave" | "circle" | "line";

export type VisualizerPlacement = "bottom" | "center" | "full";

export type VisualizerDrawOptions = {
  style: VisualizerStyle;
  colorPrimary: string;
  colorSecondary: string;
  gradient: boolean;
  /** CSS color or "transparent" */
  background: string;
  placement: VisualizerPlacement;
  /** 0.15–0.6 when placement is bottom */
  bandHeight: number;
  sensitivity: number;
};

function regionForPlacement(
  w: number,
  h: number,
  placement: VisualizerPlacement,
  bandHeight: number,
): { x: number; y: number; rw: number; rh: number } {
  if (placement === "full") return { x: 0, y: 0, rw: w, rh: h };
  const ratio = Math.min(0.6, Math.max(0.15, bandHeight));
  const rh = Math.floor(h * ratio);
  if (placement === "center") {
    return { x: 0, y: Math.floor((h - rh) / 2), rw: w, rh };
  }
  return { x: 0, y: h - rh, rw: w, rh };
}

function fillBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  background: string,
) {
  if (background === "transparent") {
    ctx.clearRect(0, 0, w, h);
    return;
  }
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);
}

function strokeFill(ctx: CanvasRenderingContext2D, gradient: boolean, c1: string, c2: string) {
  if (gradient) {
    const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.strokeStyle = g;
  } else {
    ctx.fillStyle = c1;
    ctx.strokeStyle = c1;
  }
}

export function drawVisualizerFrame(
  ctx: CanvasRenderingContext2D,
  analyser: AnalyserNode,
  opts: VisualizerDrawOptions,
  video?: HTMLVideoElement | null,
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  fillBackground(ctx, w, h, opts.background);

  if (video && video.readyState >= 2) {
    ctx.drawImage(video, 0, 0, w, h);
  }

  const region = regionForPlacement(w, h, opts.placement, opts.bandHeight);
  ctx.save();
  ctx.beginPath();
  ctx.rect(region.x, region.y, region.rw, region.rh);
  ctx.clip();

  const freq = new Uint8Array(analyser.frequencyBinCount);
  const time = new Uint8Array(analyser.fftSize);
  analyser.getByteFrequencyData(freq);
  analyser.getByteTimeDomainData(time);

  const sens = Math.max(0.5, Math.min(3, opts.sensitivity));

  switch (opts.style) {
    case "bars":
      drawBars(ctx, region, freq, sens, opts);
      break;
    case "mirror":
      drawMirror(ctx, region, freq, sens, opts);
      break;
    case "wave":
      drawWave(ctx, region, time, sens, opts);
      break;
    case "circle":
      drawCircle(ctx, region, freq, sens, opts);
      break;
    case "line":
      drawLineArea(ctx, region, freq, sens, opts);
      break;
  }
  ctx.restore();
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  r: { x: number; y: number; rw: number; rh: number },
  freq: Uint8Array,
  sens: number,
  opts: VisualizerDrawOptions,
) {
  const bars = Math.min(96, freq.length);
  const step = Math.floor(freq.length / bars);
  const gap = 2;
  const barW = Math.max(2, (r.rw - gap * bars) / bars);
  strokeFill(ctx, opts.gradient, opts.colorPrimary, opts.colorSecondary);
  for (let i = 0; i < bars; i++) {
    const v = (freq[i * step] ?? 0) / 255;
    const bh = Math.max(2, v * sens * r.rh * 0.95);
    const x = r.x + i * (barW + gap);
    const y = r.y + r.rh - bh;
    ctx.fillRect(x, y, barW, bh);
  }
}

function drawMirror(
  ctx: CanvasRenderingContext2D,
  r: { x: number; y: number; rw: number; rh: number },
  freq: Uint8Array,
  sens: number,
  opts: VisualizerDrawOptions,
) {
  const bars = Math.min(64, freq.length);
  const step = Math.floor(freq.length / bars);
  const gap = 2;
  const barW = Math.max(2, (r.rw - gap * bars) / bars);
  const mid = r.y + r.rh / 2;
  strokeFill(ctx, opts.gradient, opts.colorPrimary, opts.colorSecondary);
  for (let i = 0; i < bars; i++) {
    const v = (freq[i * step] ?? 0) / 255;
    const half = Math.max(1, (v * sens * r.rh * 0.45));
    const x = r.x + i * (barW + gap);
    ctx.fillRect(x, mid - half, barW, half * 2);
  }
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  r: { x: number; y: number; rw: number; rh: number },
  time: Uint8Array,
  sens: number,
  opts: VisualizerDrawOptions,
) {
  strokeFill(ctx, opts.gradient, opts.colorPrimary, opts.colorSecondary);
  ctx.lineWidth = 2;
  ctx.beginPath();
  const mid = r.y + r.rh / 2;
  for (let i = 0; i < time.length; i++) {
    const x = r.x + (i / (time.length - 1)) * r.rw;
    const v = ((time[i] ?? 128) - 128) / 128;
    const y = mid + v * sens * (r.rh * 0.45);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  r: { x: number; y: number; rw: number; rh: number },
  freq: Uint8Array,
  sens: number,
  opts: VisualizerDrawOptions,
) {
  const cx = r.x + r.rw / 2;
  const cy = r.y + r.rh / 2;
  const baseR = Math.min(r.rw, r.rh) * 0.22;
  const bars = Math.min(72, freq.length);
  const step = Math.floor(freq.length / bars);
  strokeFill(ctx, opts.gradient, opts.colorPrimary, opts.colorSecondary);
  ctx.lineWidth = Math.max(2, baseR * 0.08);
  for (let i = 0; i < bars; i++) {
    const v = (freq[i * step] ?? 0) / 255;
    const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
    const len = baseR + v * sens * baseR * 1.8;
    const x1 = cx + Math.cos(angle) * baseR;
    const y1 = cy + Math.sin(angle) * baseR;
    const x2 = cx + Math.cos(angle) * len;
    const y2 = cy + Math.sin(angle) * len;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function drawLineArea(
  ctx: CanvasRenderingContext2D,
  r: { x: number; y: number; rw: number; rh: number },
  freq: Uint8Array,
  sens: number,
  opts: VisualizerDrawOptions,
) {
  const n = Math.min(128, freq.length);
  const step = Math.floor(freq.length / n);
  const base = r.y + r.rh;
  strokeFill(ctx, opts.gradient, opts.colorPrimary, opts.colorSecondary);
  ctx.beginPath();
  ctx.moveTo(r.x, base);
  for (let i = 0; i < n; i++) {
    const x = r.x + (i / (n - 1)) * r.rw;
    const v = (freq[i * step] ?? 0) / 255;
    const y = base - v * sens * r.rh * 0.92;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(r.x + r.rw, base);
  ctx.closePath();
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = r.x + (i / (n - 1)) * r.rw;
    const v = (freq[i * step] ?? 0) / 255;
    const y = base - v * sens * r.rh * 0.92;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
