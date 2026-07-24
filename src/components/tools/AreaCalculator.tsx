"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import {
  polygonArea,
  polygonPerimeter,
  regularPolygon,
  rectPoints,
  setEdgeLength,
  sideLengths,
  trianglePoints,
  type Point,
} from "@/lib/geometry/area";

type Props = { labels: Dictionary["tools"]["areaCalculator"] };
type ShapeKind = "rectangle" | "triangle" | "polygon";

const DEFAULT_SCALE = 0.5; // metres per pixel

export default function AreaCalculator({ labels }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [kind, setKind] = useState<ShapeKind>("rectangle");
  const [points, setPoints] = useState<Point[]>(() => rectPoints(240, 160));
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [sideInputs, setSideInputs] = useState<string[]>([]);

  const metresSides = sideLengths(points).map((px) => px * scale);
  const areaM2 = polygonArea(points) * scale * scale;
  const periM = polygonPerimeter(points) * scale;

  const syncSideInputs = useCallback(
    (pts: Point[], s: number) => {
      setSideInputs(sideLengths(pts).map((px) => (px * s).toFixed(2)));
    },
    [],
  );

  useEffect(() => {
    syncSideInputs(points, scale);
  }, [points, scale, syncSideInputs]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 640;
    const cssH = canvas.clientHeight || 320;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, cssW, cssH);

    // grid
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (let x = 0; x < cssW; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssH);
      ctx.stroke();
    }
    for (let y = 0; y < cssH; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
      ctx.stroke();
    }

    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i]!.x, points[i]!.y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(8, 145, 178, 0.18)";
    ctx.fill();
    ctx.strokeStyle = "#0e7490";
    ctx.lineWidth = 2;
    ctx.stroke();

    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#0891b2";
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), p.x, p.y);
    });

    // side labels mid-edge
    ctx.fillStyle = "#334155";
    ctx.font = "11px sans-serif";
    for (let i = 0; i < points.length; i++) {
      const a = points[i]!;
      const b = points[(i + 1) % points.length]!;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const len = (sideLengths(points)[i]! * scale).toFixed(1);
      ctx.fillText(`${len} m`, mx, my - 10);
    }
  }, [points, scale]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  function applyKind(next: ShapeKind) {
    setKind(next);
    if (next === "rectangle") setPoints(rectPoints(240, 160));
    else if (next === "triangle") setPoints(trianglePoints(240, 180));
    else setPoints(regularPolygon(5, 110));
  }

  function canvasPoint(clientX: number, clientY: number): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function hitVertex(p: Point): number | null {
    for (let i = 0; i < points.length; i++) {
      if (Math.hypot(points[i]!.x - p.x, points[i]!.y - p.y) <= 12) return i;
    }
    return null;
  }

  function onSideChange(index: number, raw: string) {
    const nextInputs = [...sideInputs];
    nextInputs[index] = raw;
    setSideInputs(nextInputs);
    const val = Number(raw);
    if (!Number.isFinite(val) || val <= 0 || scale <= 0) return;
    const pxLen = val / scale;
    setPoints((pts) => setEdgeLength(pts, index, pxLen));
  }

  function onScaleChange(raw: string) {
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= 0) {
      setScale(v);
      return;
    }
    setScale(v);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.hint}</p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["rectangle", labels.shapeRectangle],
            ["triangle", labels.shapeTriangle],
            ["polygon", labels.shapePolygon],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => applyKind(key)}
            className={`min-h-10 rounded-xl px-3 text-sm font-medium ${
              kind === key
                ? "bg-cyan-600 text-white"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
        {kind === "polygon" ? (
          <button
            type="button"
            onClick={() =>
              setPoints((pts) =>
                pts.length >= 8
                  ? regularPolygon(3, 110)
                  : regularPolygon(pts.length + 1, 110),
              )
            }
            className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm font-medium"
          >
            {labels.addVertex}
          </button>
        ) : null}
      </div>

      <label className="block max-w-xs text-sm">
        <span className="mb-1 block font-medium text-slate-700">
          {labels.scaleLabel}
        </span>
        <input
          type="number"
          min={0.01}
          step={0.01}
          value={scale}
          onChange={(e) => onScaleChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
        />
        <span className="mt-1 block text-xs text-slate-500">{labels.scaleHint}</span>
      </label>

      <canvas
        ref={canvasRef}
        className="h-72 w-full touch-none rounded-xl border border-slate-200 bg-slate-50"
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          const hit = hitVertex(canvasPoint(e.clientX, e.clientY));
          setDragIndex(hit);
        }}
        onPointerMove={(e) => {
          if (dragIndex === null || e.buttons !== 1) return;
          const p = canvasPoint(e.clientX, e.clientY);
          setPoints((pts) =>
            pts.map((pt, i) => (i === dragIndex ? p : pt)),
          );
        }}
        onPointerUp={() => setDragIndex(null)}
        onPointerCancel={() => setDragIndex(null)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {labels.area}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {areaM2.toFixed(2)}{" "}
            <span className="text-base font-semibold text-slate-500">
              {labels.unitArea}
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {labels.perimeter}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {periM.toFixed(2)}{" "}
            <span className="text-base font-semibold text-slate-500">
              {labels.unitLength}
            </span>
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">
          {labels.sidesHeading}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {sideInputs.map((val, i) => (
            <label key={i} className="text-sm">
              <span className="mb-1 block text-slate-600">
                {labels.side} {i + 1}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={val}
                  onChange={(e) => onSideChange(i, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
                <span className="shrink-0 text-xs text-slate-500">
                  {labels.unitLength}
                </span>
              </div>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">{labels.sidesHint}</p>
        <p className="mt-1 text-xs tabular-nums text-slate-400">
          {labels.liveCheck}:{" "}
          {metresSides.map((m) => m.toFixed(2)).join(" · ")} {labels.unitLength}
        </p>
      </div>
    </div>
  );
}
