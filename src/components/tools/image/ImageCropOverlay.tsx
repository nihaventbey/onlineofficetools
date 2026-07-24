"use client";

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

export type CropRect = { x: number; y: number; w: number; h: number };

type Handle = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type Props = {
  src: string | null;
  imgWidth: number;
  imgHeight: number;
  crop: CropRect;
  onChange: (crop: CropRect) => void;
  /** Lock aspect ratio (width/height). Null = free. */
  aspectRatio?: number | null;
  disabled?: boolean;
  className?: string;
};

export function clampCropRect(
  next: CropRect,
  iw: number,
  ih: number,
  aspect?: number | null,
): CropRect {
  let { x, y, w, h } = next;
  w = Math.max(8, Math.min(w, iw));
  h = Math.max(8, Math.min(h, ih));
  if (aspect && aspect > 0) {
    const hFromW = w / aspect;
    if (hFromW <= ih) {
      h = hFromW;
    } else {
      h = ih;
      w = h * aspect;
    }
  }
  x = Math.max(0, Math.min(x, iw - w));
  y = Math.max(0, Math.min(y, ih - h));
  w = Math.min(w, iw - x);
  h = Math.min(h, ih - y);
  return {
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(w),
    h: Math.round(h),
  };
}

export default function ImageCropOverlay({
  src,
  imgWidth,
  imgHeight,
  crop,
  onChange,
  aspectRatio = null,
  disabled,
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    origin: CropRect;
  } | null>(null);

  const toImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      const el = wrapRef.current;
      if (!el || !imgWidth || !imgHeight) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) * imgWidth) / rect.width,
        y: ((clientY - rect.top) * imgHeight) / rect.height,
      };
    },
    [imgWidth, imgHeight],
  );

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || disabled) return;
      const cur = toImageCoords(e.clientX, e.clientY);
      const dx = cur.x - drag.startX;
      const dy = cur.y - drag.startY;
      const o = drag.origin;
      let next: CropRect = { ...o };

      switch (drag.handle) {
        case "move":
          next = { ...o, x: o.x + dx, y: o.y + dy };
          break;
        case "e":
          next = { ...o, w: o.w + dx };
          break;
        case "w":
          next = { ...o, x: o.x + dx, w: o.w - dx };
          break;
        case "s":
          next = { ...o, h: o.h + dy };
          break;
        case "n":
          next = { ...o, y: o.y + dy, h: o.h - dy };
          break;
        case "se":
          next = { ...o, w: o.w + dx, h: o.h + dy };
          break;
        case "sw":
          next = { ...o, x: o.x + dx, w: o.w - dx, h: o.h + dy };
          break;
        case "ne":
          next = { ...o, y: o.y + dy, w: o.w + dx, h: o.h - dy };
          break;
        case "nw":
          next = { ...o, x: o.x + dx, y: o.y + dy, w: o.w - dx, h: o.h - dy };
          break;
      }

      if (aspectRatio && aspectRatio > 0 && drag.handle !== "move") {
        if (drag.handle === "e" || drag.handle === "w") {
          next.h = next.w / aspectRatio;
        } else if (drag.handle === "n" || drag.handle === "s") {
          next.w = next.h * aspectRatio;
        } else {
          next.h = next.w / aspectRatio;
          if (drag.handle === "nw" || drag.handle === "ne") {
            next.y = o.y + o.h - next.h;
          }
          if (drag.handle === "nw" || drag.handle === "sw") {
            next.x = o.x + o.w - next.w;
          }
        }
      }

      onChange(clampCropRect(next, imgWidth, imgHeight, null));
    }

    function onUp() {
      dragRef.current = null;
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [aspectRatio, disabled, onChange, toImageCoords, imgHeight, imgWidth]);

  if (!src || !imgWidth || !imgHeight) {
    return (
      <div
        className={`flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400 ${className}`}
      />
    );
  }

  const left = `${(crop.x / imgWidth) * 100}%`;
  const top = `${(crop.y / imgHeight) * 100}%`;
  const width = `${(crop.w / imgWidth) * 100}%`;
  const height = `${(crop.h / imgHeight) * 100}%`;

  function startDrag(handle: Handle, e: ReactPointerEvent) {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const p = toImageCoords(e.clientX, e.clientY);
    dragRef.current = { handle, startX: p.x, startY: p.y, origin: { ...crop } };
  }

  const handles: { id: Handle; style: string }[] = [
    { id: "nw", style: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" },
    { id: "n", style: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize" },
    { id: "ne", style: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize" },
    { id: "e", style: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize" },
    { id: "se", style: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize" },
    { id: "s", style: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize" },
    { id: "sw", style: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" },
    { id: "w", style: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize" },
  ];

  return (
    <div
      ref={wrapRef}
      className={`relative mx-auto w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 ${className}`}
      style={{ aspectRatio: `${imgWidth} / ${imgHeight}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-fill"
      />
      <div
        role="presentation"
        className={`absolute border-2 border-sky-400 ${
          disabled ? "pointer-events-none" : "cursor-move"
        }`}
        style={{
          left,
          top,
          width,
          height,
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.45)",
          touchAction: "none",
        }}
        onPointerDown={(e) => startDrag("move", e)}
      >
        {handles.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-label={h.id}
            disabled={disabled}
            style={{ touchAction: "none" }}
            className={`absolute h-3.5 w-3.5 rounded-sm border-2 border-sky-500 bg-white ${h.style}`}
            onPointerDown={(e) => startDrag(h.id, e)}
          />
        ))}
      </div>
    </div>
  );
}
