"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { formatBytes } from "@/lib/files/utils";
import { useClipboardPaste } from "@/lib/hooks/useClipboardPaste";

type Props = {
  labels: Dictionary["tools"]["imageColorPicker"];
};

type ColorFormats = {
  hex: string;
  rgb: string;
  hsl: string;
  cmyk: string;
  r: number;
  g: number;
  b: number;
};

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

// Convert RGB to CMYK
function rgbToCmyk(r: number, g: number, b: number): string {
  let c = 1 - r / 255;
  let m = 1 - g / 255;
  let y = 1 - b / 255;
  const k = Math.min(c, Math.min(m, y));

  if (k === 1) {
    return "cmyk(0%, 0%, 0%, 100%)";
  }

  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);

  return `cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`;
}

// Relative luminance for WCAG contrast
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (rs ?? 0) + 0.7152 * (gs ?? 0) + 0.0722 * (bs ?? 0);
}

function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function ImageColorPicker({ labels }: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [currentColor, setCurrentColor] = useState<ColorFormats>({
    hex: "#3B82F6",
    rgb: "rgb(59, 130, 246)",
    hsl: "hsl(217, 91%, 60%)",
    cmyk: "cmyk(76%, 47%, 0%, 4%)",
    r: 59,
    g: 130,
    b: 246,
  });

  const [palette, setPalette] = useState<string[]>([]);
  const [savedColors, setSavedColors] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Loupe magnifier state
  const [loupePos, setLoupePos] = useState<{ x: number; y: number } | null>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Clipboard paste support (Ctrl+V / Cmd+V)
  useClipboardPaste({
    accept: "image/*",
    onFiles: (files) => {
      if (files[0]) handleFile(files[0]);
    },
  });

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setImageSrc(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  // Draw image on canvas and extract dominant palette
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageElementRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      // Extract 6 dominant colors by sampling
      extractPalette(ctx, canvas.width, canvas.height);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  function extractPalette(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const stepX = Math.max(1, Math.floor(width / 40));
    const stepY = Math.max(1, Math.floor(height / 40));
    const colorMap: Record<string, number> = {};

    for (let x = 0; x < width; x += stepX) {
      for (let y = 0; y < height; y += stepY) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        if (pixel[3] < 128) continue; // Skip transparent
        // Round to nearest multiple of 16 to cluster similar tones
        const r = Math.round(pixel[0] / 24) * 24;
        const g = Math.round(pixel[1] / 24) * 24;
        const b = Math.round(pixel[2] / 24) * 24;
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        colorMap[hex] = (colorMap[hex] || 0) + 1;
      }
    }

    const sorted = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([hex]) => hex);

    setPalette(sorted);
  }

  // Mouse move on canvas -> update Loupe magnifier
  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const imgX = Math.floor(clientX * scaleX);
    const imgY = Math.floor(clientY * scaleY);

    setLoupePos({ x: clientX, y: clientY });
    setIsHovering(true);

    // Draw 8x magnified view in Loupe
    const loupe = loupeCanvasRef.current;
    if (!loupe) return;
    const lCtx = loupe.getContext("2d");
    if (!lCtx) return;

    lCtx.imageSmoothingEnabled = false;
    lCtx.clearRect(0, 0, loupe.width, loupe.height);

    const zoomRadius = 5; // 11x11 pixel area
    lCtx.drawImage(
      canvas,
      imgX - zoomRadius,
      imgY - zoomRadius,
      zoomRadius * 2 + 1,
      zoomRadius * 2 + 1,
      0,
      0,
      loupe.width,
      loupe.height,
    );

    // Draw central target crosshair
    lCtx.strokeStyle = "#ffffff";
    lCtx.lineWidth = 2;
    lCtx.strokeRect(loupe.width / 2 - 5, loupe.height / 2 - 5, 10, 10);
    lCtx.strokeStyle = "#000000";
    lCtx.lineWidth = 1;
    lCtx.strokeRect(loupe.width / 2 - 5, loupe.height / 2 - 5, 10, 10);
  }

  // Click on canvas -> pick color
  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const imgX = Math.floor((e.clientX - rect.left) * scaleX);
    const imgY = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const pixel = ctx.getImageData(imgX, imgY, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const hsl = rgbToHsl(r, g, b);
    const cmyk = rgbToCmyk(r, g, b);

    setCurrentColor({ hex, rgb, hsl, cmyk, r, g, b });
    setSavedColors((prev) => [hex, ...prev.filter((c) => c !== hex)].slice(0, 12));
  }

  function copyText(key: string, val: string) {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  }

  // WCAG Accessibility contrast calculation
  const colorLum = getLuminance(currentColor.r, currentColor.g, currentColor.b);
  const contrastWithWhite = getContrastRatio(colorLum, 1.0);
  const contrastWithBlack = getContrastRatio(colorLum, 0.0);

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {!imageSrc ? (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/20"
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />
          <span className="text-4xl mb-2">🎨</span>
          <span className="text-sm font-bold text-slate-800">
            {labels.dropTitle || "Drop an image or click to select"}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            {labels.dropSubtitle || "PNG, JPG, WebP, SVG supported — 100% locally in your browser"}
          </span>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex min-h-[38px] items-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20">
              {labels.selectImage || "Select Image"}
            </span>
            <span className="inline-flex min-h-[28px] items-center gap-1 rounded-lg border border-slate-200 bg-white/80 px-2 py-0.5 text-[11px] font-medium text-slate-500 shadow-2xs backdrop-blur-xs">
              <kbd className="font-sans font-semibold text-slate-700">Ctrl</kbd>+<kbd className="font-sans font-semibold text-slate-700">V</kbd>
            </span>
          </div>
        </label>
      ) : (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div
                style={{ backgroundColor: currentColor.hex }}
                className="h-10 w-10 shrink-0 rounded-xl shadow-md border-2 border-white ring-1 ring-slate-200"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-800 truncate max-w-sm">
                  {imageFile?.name || "Pasted Image"}
                </h4>
                <p className="text-xs text-slate-500">
                  {imageFile ? formatBytes(imageFile.size) : ""} · {labels.clickToPick || "Hover & Click anywhere to pick pixel color"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setImageSrc(null);
                setImageFile(null);
                setPalette([]);
              }}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              {labels.changeImage || "Change Image"}
            </button>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Canvas with Loupe (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  onPointerMove={handlePointerMove}
                  onPointerLeave={() => setIsHovering(false)}
                  onClick={handleCanvasClick}
                  className="max-h-[460px] w-auto max-w-full rounded-lg object-contain cursor-crosshair shadow-xs"
                />

                {/* Floating Loupe Magnifier Bubble */}
                {isHovering && loupePos && (
                  <div
                    style={{
                      left: `${Math.min(loupePos.x + 20, 320)}px`,
                      top: `${Math.max(10, loupePos.y - 100)}px`,
                    }}
                    className="pointer-events-none absolute h-24 w-24 overflow-hidden rounded-full border-2 border-white shadow-2xl ring-2 ring-slate-900/30 z-10"
                  >
                    <canvas
                      ref={loupeCanvasRef}
                      width={96}
                      height={96}
                      className="h-full w-full"
                    />
                  </div>
                )}
              </div>

              {/* Dominant Palette Strip */}
              {palette.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {labels.dominantPalette || "Dominant Color Palette"}
                  </span>
                  <div className="grid grid-cols-6 gap-2">
                    {palette.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          const r = parseInt(col.slice(1, 3), 16);
                          const g = parseInt(col.slice(3, 5), 16);
                          const b = parseInt(col.slice(5, 7), 16);
                          setCurrentColor({
                            hex: col,
                            rgb: `rgb(${r}, ${g}, ${b})`,
                            hsl: rgbToHsl(r, g, b),
                            cmyk: rgbToCmyk(r, g, b),
                            r,
                            g,
                            b,
                          });
                        }}
                        style={{ backgroundColor: col }}
                        className="group relative h-10 rounded-xl shadow-2xs border border-black/10 transition transform active:scale-95 hover:scale-105"
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 drop-shadow-md">
                          Pick
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Color Details & Format Codes (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Big Color Preview Card */}
              <div
                style={{ backgroundColor: currentColor.hex }}
                className="h-28 rounded-2xl shadow-md border-2 border-white ring-1 ring-slate-200 flex flex-col justify-end p-4 transition-colors"
              >
                <span
                  style={{ color: contrastWithWhite > contrastWithBlack ? "#ffffff" : "#000000" }}
                  className="text-lg font-black tracking-wider"
                >
                  {currentColor.hex}
                </span>
              </div>

              {/* Color Format Codes List */}
              <div className="space-y-2 text-xs">
                {[
                  { label: "HEX", val: currentColor.hex },
                  { label: "RGB", val: currentColor.rgb },
                  { label: "HSL", val: currentColor.hsl },
                  { label: "CMYK", val: currentColor.cmyk },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-10 font-bold uppercase text-slate-400">
                        {label}
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {val}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(label, val)}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      {copiedKey === label ? `✓ ${labels.copied || "Copied"}` : `📋 ${labels.copy || "Copy"}`}
                    </button>
                  </div>
                ))}
              </div>

              {/* WCAG Accessibility Contrast Ratings */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {labels.wcagContrast || "WCAG 2.1 Accessibility Contrast"}
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-white p-2 text-center">
                    <span className="block text-[10px] text-slate-400 font-semibold">on White</span>
                    <span className="text-sm font-extrabold text-slate-800">
                      {contrastWithWhite.toFixed(2)} : 1
                    </span>
                    <span className={`block text-[10px] font-bold ${contrastWithWhite >= 4.5 ? "text-emerald-600" : "text-amber-600"}`}>
                      {contrastWithWhite >= 7.0 ? "AAA Pass" : contrastWithWhite >= 4.5 ? "AA Pass" : "Fail"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-2 text-center">
                    <span className="block text-[10px] text-slate-400 font-semibold">on Black</span>
                    <span className="text-sm font-extrabold text-slate-800">
                      {contrastWithBlack.toFixed(2)} : 1
                    </span>
                    <span className={`block text-[10px] font-bold ${contrastWithBlack >= 4.5 ? "text-emerald-600" : "text-amber-600"}`}>
                      {contrastWithBlack >= 7.0 ? "AAA Pass" : contrastWithBlack >= 4.5 ? "AA Pass" : "Fail"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Saved Colors History */}
              {savedColors.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {labels.savedColors || "Recently Picked Colors"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {savedColors.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          const r = parseInt(col.slice(1, 3), 16);
                          const g = parseInt(col.slice(3, 5), 16);
                          const b = parseInt(col.slice(5, 7), 16);
                          setCurrentColor({
                            hex: col,
                            rgb: `rgb(${r}, ${g}, ${b})`,
                            hsl: rgbToHsl(r, g, b),
                            cmyk: rgbToCmyk(r, g, b),
                            r,
                            g,
                            b,
                          });
                        }}
                        style={{ backgroundColor: col }}
                        className="h-6 w-6 rounded-lg border border-black/10 shadow-2xs transition hover:scale-110"
                        title={col}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
