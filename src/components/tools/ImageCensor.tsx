"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  labels: Dictionary["tools"]["imageBlur"];
};

type CensorType = "pixelate" | "blur" | "black";
type ToolMode = "rect" | "brush";

export default function ImageCensor({ labels }: Props) {
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>("image");
  const [censorType, setCensorType] = useState<CensorType>("pixelate");
  const [toolMode, setToolMode] = useState<ToolMode>("rect");
  const [brushSize, setBrushSize] = useState<number>(25);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // File loading
  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSourceImg(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Draw initial image onto canvas
  useEffect(() => {
    if (!sourceImg || !canvasRef.current || !overlayCanvasRef.current) return;
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;

    canvas.width = sourceImg.naturalWidth;
    canvas.height = sourceImg.naturalHeight;
    overlay.width = sourceImg.naturalWidth;
    overlay.height = sourceImg.naturalHeight;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(sourceImg, 0, 0);
      setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    }
  }, [sourceImg]);

  function saveState() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), data]);
  }

  function handleUndo() {
    if (history.length <= 1 || !canvasRef.current) return;
    const newHist = [...history];
    newHist.pop(); // Remove current
    const prev = newHist[newHist.length - 1];
    const ctx = canvasRef.current.getContext("2d");
    if (ctx && prev) {
      ctx.putImageData(prev, 0, 0);
      setHistory(newHist);
    }
  }

  // Apply Pixelate Effect on a rectangular area
  function applyPixelate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, blockSize = 14) {
    const minX = Math.max(0, Math.floor(x));
    const minY = Math.max(0, Math.floor(y));
    const maxX = Math.min(ctx.canvas.width, Math.ceil(x + w));
    const maxY = Math.min(ctx.canvas.height, Math.ceil(y + h));
    const imgData = ctx.getImageData(minX, minY, maxX - minX, maxY - minY);
    const data = imgData.data;
    const width = maxX - minX;
    const height = maxY - minY;

    for (let py = 0; py < height; py += blockSize) {
      for (let px = 0; px < width; px += blockSize) {
        const curBlockW = Math.min(blockSize, width - px);
        const curBlockH = Math.min(blockSize, height - py);

        // Calculate average color
        let r = 0, g = 0, b = 0, count = 0;
        for (let dy = 0; dy < curBlockH; dy++) {
          for (let dx = 0; dx < curBlockW; dx++) {
            const idx = ((py + dy) * width + (px + dx)) * 4;
            r += data[idx]!;
            g += data[idx + 1]!;
            b += data[idx + 2]!;
            count++;
          }
        }
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        // Fill block with average color
        for (let dy = 0; dy < curBlockH; dy++) {
          for (let dx = 0; dx < curBlockW; dx++) {
            const idx = ((py + dy) * width + (px + dx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
        }
      }
    }
    ctx.putImageData(imgData, minX, minY);
  }

  // Apply Blur Effect
  function applyBlur(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const minX = Math.max(0, Math.floor(x));
    const minY = Math.max(0, Math.floor(y));
    const width = Math.min(ctx.canvas.width - minX, Math.ceil(w));
    const height = Math.min(ctx.canvas.height - minY, Math.ceil(h));

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tCtx = tempCanvas.getContext("2d");
    if (!tCtx) return;

    tCtx.filter = "blur(12px)";
    tCtx.drawImage(ctx.canvas, minX, minY, width, height, 0, 0, width, height);
    ctx.drawImage(tempCanvas, minX, minY);
  }

  // Apply Black Bar
  function applyBlack(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(x, y, w, h);
  }

  function applyCensor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const rx = w < 0 ? x + w : x;
    const ry = h < 0 ? y + h : y;
    const rw = Math.abs(w);
    const rh = Math.abs(h);

    if (censorType === "pixelate") applyPixelate(ctx, rx, ry, rw, rh);
    else if (censorType === "blur") applyBlur(ctx, rx, ry, rw, rh);
    else if (censorType === "black") applyBlack(ctx, rx, ry, rw, rh);
  }

  // Pointer coordinate calculation relative to actual canvas resolution
  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function handlePointerDown(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const pos = getPos(e);
    setStartPos(pos);

    if (toolMode === "brush" && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        applyCensor(ctx, pos.x - brushSize / 2, pos.y - brushSize / 2, brushSize, brushSize);
      }
    }
  }

  function handlePointerMove(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing || !startPos) return;
    const pos = getPos(e);

    if (toolMode === "rect" && overlayCanvasRef.current) {
      const oCtx = overlayCanvasRef.current.getContext("2d");
      if (oCtx) {
        oCtx.clearRect(0, 0, oCtx.canvas.width, oCtx.canvas.height);
        oCtx.strokeStyle = "#3b82f6";
        oCtx.lineWidth = 3;
        oCtx.setLineDash([6, 6]);
        oCtx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      }
    } else if (toolMode === "brush" && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        applyCensor(ctx, pos.x - brushSize / 2, pos.y - brushSize / 2, brushSize, brushSize);
      }
    }
  }

  function handlePointerUp(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (toolMode === "rect" && startPos && canvasRef.current && overlayCanvasRef.current) {
      const oCtx = overlayCanvasRef.current.getContext("2d");
      oCtx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

      const pos = getPos(e);
      const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
      if (ctx && Math.abs(pos.x - startPos.x) > 3 && Math.abs(pos.y - startPos.y) > 3) {
        applyCensor(ctx, startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      }
    }

    setStartPos(null);
    saveState();
  }

  function handleDownload() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${fileName}-sansurlu.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {!sourceImg ? (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/20"
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
          <span className="text-4xl mb-2">🕶️</span>
          <span className="text-sm font-bold text-slate-800">
            Sansürlemek istediğiniz görseli buraya sürükleyin
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Ekran görüntüsü, kimlik, dekont, fiş veya fotoğraf (Sunucuya yüklenmez, %100 gizli)
          </span>
          <span className="mt-4 inline-flex min-h-[38px] items-center rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-md shadow-blue-500/20">
            Görsel Seç
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3.5">
            {/* Tool Mode: Rect vs Brush */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setToolMode("rect")}
                className={`rounded-lg px-3 py-1.5 transition active:scale-95 ${toolMode === "rect" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600"}`}
              >
                ⬛ Dikdörtgen Seçim
              </button>
              <button
                type="button"
                onClick={() => setToolMode("brush")}
                className={`rounded-lg px-3 py-1.5 transition active:scale-95 ${toolMode === "brush" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600"}`}
              >
                🖌️ Fırça Modu
              </button>
            </div>

            {/* Effect Style: Pixelate, Blur, Black */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCensorType("pixelate")}
                className={`rounded-lg px-3 py-1.5 transition active:scale-95 ${censorType === "pixelate" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600"}`}
              >
                ▦ Mozaik
              </button>
              <button
                type="button"
                onClick={() => setCensorType("blur")}
                className={`rounded-lg px-3 py-1.5 transition active:scale-95 ${censorType === "blur" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600"}`}
              >
                🌫️ Buzlama
              </button>
              <button
                type="button"
                onClick={() => setCensorType("black")}
                className={`rounded-lg px-3 py-1.5 transition active:scale-95 ${censorType === "black" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600"}`}
              >
                ⬛ Siyah Şerit
              </button>
            </div>

            {/* Actions: Undo & Reset */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={history.length <= 1}
                onClick={handleUndo}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs disabled:opacity-40"
              >
                ↩ Geri Al
              </button>
              <button
                type="button"
                onClick={() => setSourceImg(null)}
                className="text-xs text-rose-600 hover:underline px-2"
              >
                Kapat
              </button>
            </div>
          </div>

          {/* Brush size option if brush mode is active */}
          {toolMode === "brush" && (
            <div className="flex items-center gap-3 px-2 text-xs font-semibold text-slate-600">
              <span>Fırça Boyutu:</span>
              <input
                type="range"
                min={10}
                max={60}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-48 accent-blue-600"
              />
              <span>{brushSize}px</span>
            </div>
          )}

          {/* Interactive Canvas Work Area */}
          <div className="relative flex max-h-[70vh] items-center justify-center overflow-auto rounded-2xl border border-slate-200 bg-slate-100/60 p-2">
            <div className="relative inline-block select-none shadow-md">
              <canvas
                ref={canvasRef}
                className="block max-h-[65vh] w-auto max-w-full touch-none"
              />
              <canvas
                ref={overlayCanvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                className="absolute inset-0 cursor-crosshair touch-none"
              />
            </div>
          </div>

          {/* Download Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">
                Görseliniz tarayıcınızda yerel olarak sansürlenir.
              </p>
              <p className="text-[11px] text-slate-500">
                Hassas verileriniz asla sunuculara iletilmez.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-500 active:scale-95"
            >
              📥 Sansürlenmiş Görseli İndir (PNG)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
