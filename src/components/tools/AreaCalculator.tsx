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

type AreaUnit = "m2" | "sqft" | "acre" | "hectare" | "donum";

const DEFAULT_SCALE = 0.5; // metres per pixel

export default function AreaCalculator({ labels }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [kind, setKind] = useState<ShapeKind>("rectangle");
  const [points, setPoints] = useState<Point[]>(() => rectPoints(240, 160));
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [sideInputs, setSideInputs] = useState<string[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<AreaUnit>("m2");

  // Base metrics in Metres
  const metresSides = sideLengths(points).map((px) => px * scale);
  const areaM2 = polygonArea(points) * scale * scale;
  const periM = polygonPerimeter(points) * scale;

  // Conversions
  const conversions = {
    m2: areaM2,
    sqft: areaM2 * 10.7639,
    acre: areaM2 / 4046.86,
    hectare: areaM2 / 10000,
    donum: areaM2 / 1000,
  };

  const perimeterConversions = {
    m: periM,
    ft: periM * 3.28084,
  };

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
      const lenM = sideLengths(points)[i]! * scale;
      const text = selectedUnit === "sqft" || selectedUnit === "acre"
        ? `${(lenM * 3.28084).toFixed(1)} ft`
        : `${lenM.toFixed(1)} m`;
      ctx.fillText(text, mx, my - 10);
    }
  }, [points, scale, selectedUnit]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  function switchKind(k: ShapeKind) {
    setKind(k);
    if (k === "rectangle") setPoints(rectPoints(240, 160));
    else if (k === "triangle") setPoints(trianglePoints(200, 160));
    else setPoints(regularPolygon(5, 110));
  }

  function addVertex() {
    if (kind !== "polygon") return;
    const last = points[points.length - 1]!;
    const first = points[0]!;
    const np: Point = {
      x: (last.x + first.x) / 2 + 25,
      y: (last.y + first.y) / 2 + 25,
    };
    setPoints([...points, np]);
  }

  function onSideChange(idx: number, val: string) {
    const next = [...sideInputs];
    next[idx] = val;
    setSideInputs(next);
    const num = parseFloat(val);
    if (!Number.isFinite(num) || num <= 0) return;
    const px = num / scale;
    setPoints((pts) => setEdgeLength(pts, idx, px));
  }

  function onScaleChange(val: string) {
    const n = parseFloat(val);
    if (Number.isFinite(n) && n > 0) setScale(n);
  }

  function hitVertex(p: Point): number | null {
    for (let i = 0; i < points.length; i++) {
      const d = Math.hypot(points[i]!.x - p.x, points[i]!.y - p.y);
      if (d <= 14) return i;
    }
    return null;
  }

  function canvasPoint(cx: number, cy: number): Point {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return { x: cx - r.left, y: cy - r.top };
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {/* Top Shape & Unit Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Shape Types */}
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => switchKind("rectangle")}
            className={`min-h-[34px] rounded-lg px-3 transition active:scale-95 ${
              kind === "rectangle" ? "bg-white text-cyan-800 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {labels.shapeRectangle}
          </button>
          <button
            type="button"
            onClick={() => switchKind("triangle")}
            className={`min-h-[34px] rounded-lg px-3 transition active:scale-95 ${
              kind === "triangle" ? "bg-white text-cyan-800 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {labels.shapeTriangle}
          </button>
          <button
            type="button"
            onClick={() => switchKind("polygon")}
            className={`min-h-[34px] rounded-lg px-3 transition active:scale-95 ${
              kind === "polygon" ? "bg-white text-cyan-800 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {labels.shapePolygon}
          </button>
        </div>

        {/* Global Units Selector */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <span className="text-[11px] font-bold text-slate-500 px-2 uppercase tracking-wider">
            Unit:
          </span>
          {[
            { id: "m2", label: "m²" },
            { id: "sqft", label: "sq ft" },
            { id: "acre", label: "Acre" },
            { id: "hectare", label: "ha" },
            { id: "donum", label: "Dönüm" },
          ].map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedUnit(u.id as AreaUnit)}
              className={`min-h-[32px] rounded-lg px-2.5 transition active:scale-95 ${
                selectedUnit === u.id ? "bg-cyan-700 text-white font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {kind === "polygon" ? (
        <div>
          <button
            type="button"
            onClick={addVertex}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 text-xs font-bold text-cyan-800 hover:bg-cyan-100"
          >
            + {labels.addVertex}
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <label className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">
            {labels.scaleLabel} (m/px):
          </span>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={scale}
            onChange={(e) => onScaleChange(e.target.value)}
            className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold outline-none focus:border-cyan-500"
          />
        </label>
        <span className="text-slate-400">
          {labels.scaleHint}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        className="h-72 w-full touch-none rounded-2xl border border-slate-200 bg-slate-50 cursor-crosshair"
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

      {/* Main Results Dashboard */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/70 via-sky-50/30 to-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-800">
            {labels.area}
          </p>
          <p className="mt-1 text-3xl font-black tabular-nums text-slate-900">
            {conversions[selectedUnit].toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}{" "}
            <span className="text-base font-bold text-cyan-700">
              {selectedUnit === "m2"
                ? "m²"
                : selectedUnit === "sqft"
                ? "sq ft"
                : selectedUnit === "acre"
                ? "Acres"
                : selectedUnit === "hectare"
                ? "Hectares (ha)"
                : "Dönüm"}
            </span>
          </p>

          {/* Sub-equivalents */}
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500 border-t border-cyan-100/60 pt-2">
            <span>{conversions.m2.toFixed(1)} m²</span>
            <span>·</span>
            <span>{conversions.sqft.toFixed(1)} sq ft</span>
            <span>·</span>
            <span>{conversions.acre.toFixed(3)} Acres</span>
            <span>·</span>
            <span>{conversions.hectare.toFixed(3)} ha</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {labels.perimeter}
          </p>
          <p className="mt-1 text-3xl font-black tabular-nums text-slate-900">
            {(selectedUnit === "sqft" || selectedUnit === "acre"
              ? perimeterConversions.ft
              : perimeterConversions.m
            ).toFixed(2)}{" "}
            <span className="text-base font-bold text-slate-500">
              {selectedUnit === "sqft" || selectedUnit === "acre" ? "ft" : "m"}
            </span>
          </p>
          <div className="mt-3 flex gap-2 text-[11px] font-semibold text-slate-400 border-t border-slate-200/60 pt-2">
            <span>{perimeterConversions.m.toFixed(2)} meters</span>
            <span>·</span>
            <span>{perimeterConversions.ft.toFixed(2)} feet</span>
          </div>
        </div>
      </div>

      {/* Side Edges Inputs */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          {labels.sidesHeading}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {sideInputs.map((val, i) => (
            <label key={i} className="text-xs rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
              <span className="mb-1 block font-bold text-slate-600">
                {labels.side} {i + 1}
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={val}
                  onChange={(e) => onSideChange(i, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold outline-none focus:border-cyan-500"
                />
                <span className="shrink-0 text-[11px] font-bold text-slate-400">
                  m
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
