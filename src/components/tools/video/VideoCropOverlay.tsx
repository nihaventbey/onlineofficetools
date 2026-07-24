"use client";

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { VideoCropRect } from "@/lib/video/compose";

type Handle =
  | "move"
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

type Props = {
  videoSrc: string | null;
  videoWidth: number;
  videoHeight: number;
  crop: VideoCropRect;
  onChange: (crop: VideoCropRect) => void;
  /** Lock aspect ratio (width/height). Null = free. */
  aspectRatio?: number | null;
  disabled?: boolean;
  className?: string;
  onSeeked?: () => void;
};

function clampCrop(
  next: VideoCropRect,
  vw: number,
  vh: number,
  aspect: number | null | undefined,
): VideoCropRect {
  let { x, y, w, h } = next;
  w = Math.max(8, Math.min(w, vw));
  h = Math.max(8, Math.min(h, vh));
  if (aspect && aspect > 0) {
    // Prefer width-driven, then height if needed
    const hFromW = w / aspect;
    if (hFromW <= vh) {
      h = hFromW;
    } else {
      h = vh;
      w = h * aspect;
    }
  }
  x = Math.max(0, Math.min(x, vw - w));
  y = Math.max(0, Math.min(y, vh - h));
  w = Math.min(w, vw - x);
  h = Math.min(h, vh - y);
  return {
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(w),
    h: Math.round(h),
  };
}

export default function VideoCropOverlay({
  videoSrc,
  videoWidth,
  videoHeight,
  crop,
  onChange,
  aspectRatio = null,
  disabled,
  className = "",
  onSeeked,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dragRef = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    origin: VideoCropRect;
  } | null>(null);

  const toVideoCoords = useCallback(
    (clientX: number, clientY: number) => {
      const el = wrapRef.current;
      if (!el || !videoWidth || !videoHeight) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      const scaleX = videoWidth / rect.width;
      const scaleY = videoHeight / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [videoWidth, videoHeight],
  );

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || disabled) return;
      const cur = toVideoCoords(e.clientX, e.clientY);
      const dx = cur.x - drag.startX;
      const dy = cur.y - drag.startY;
      const o = drag.origin;
      let next: VideoCropRect = { ...o };

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
          next = {
            ...o,
            x: o.x + dx,
            y: o.y + dy,
            w: o.w - dx,
            h: o.h - dy,
          };
          break;
      }

      if (aspectRatio && aspectRatio > 0 && drag.handle !== "move") {
        if (drag.handle === "e" || drag.handle === "w") {
          next.h = next.w / aspectRatio;
          if (drag.handle === "w") {
            /* x already adjusted */
          }
        } else if (drag.handle === "n" || drag.handle === "s") {
          next.w = next.h * aspectRatio;
        } else {
          // corners: width-driven
          next.h = next.w / aspectRatio;
          if (drag.handle === "nw" || drag.handle === "ne") {
            next.y = o.y + o.h - next.h;
          }
          if (drag.handle === "nw" || drag.handle === "sw") {
            next.x = o.x + o.w - next.w;
          }
        }
      }

      onChange(clampCrop(next, videoWidth, videoHeight, null));
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
  }, [
    aspectRatio,
    disabled,
    onChange,
    toVideoCoords,
    videoHeight,
    videoWidth,
  ]);

  if (!videoSrc || !videoWidth || !videoHeight) {
    return (
      <div
        className={`flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400 ${className}`}
      />
    );
  }

  const left = `${(crop.x / videoWidth) * 100}%`;
  const top = `${(crop.y / videoHeight) * 100}%`;
  const width = `${(crop.w / videoWidth) * 100}%`;
  const height = `${(crop.h / videoHeight) * 100}%`;

  function startDrag(handle: Handle, e: ReactPointerEvent) {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const p = toVideoCoords(e.clientX, e.clientY);
    dragRef.current = {
      handle,
      startX: p.x,
      startY: p.y,
      origin: { ...crop },
    };
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
      className={`relative mx-auto w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-black ${className}`}
      style={{ aspectRatio: `${videoWidth} / ${videoHeight}` }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        muted
        controls
        className="absolute inset-0 h-full w-full object-fill"
        onSeeked={onSeeked}
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
        }}
        onPointerDown={(e) => startDrag("move", e)}
      >
        {handles.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-label={h.id}
            disabled={disabled}
            className={`absolute h-3.5 w-3.5 rounded-sm border-2 border-sky-500 bg-white ${h.style}`}
            onPointerDown={(e) => startDrag(h.id, e)}
          />
        ))}
      </div>
    </div>
  );
}
