"use client";

import { useMemo } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["unitConverter"] };
type Mode = "length" | "weight" | "temperature" | "data";
type Draft = { mode: Mode; from: string; to: string; value: string };

const LENGTH: Record<string, number> = {
  m: 1,
  km: 1000,
  cm: 0.01,
  mm: 0.001,
  mi: 1609.344,
  yd: 0.9144,
  ft: 0.3048,
  in: 0.0254,
};

const WEIGHT: Record<string, number> = {
  kg: 1,
  g: 0.001,
  mg: 0.000001,
  lb: 0.45359237,
  oz: 0.028349523125,
};

const DATA: Record<string, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
};

function convertTemp(value: number, from: string, to: string): number {
  let c = value;
  if (from === "F") c = ((value - 32) * 5) / 9;
  if (from === "K") c = value - 273.15;
  if (to === "C") return c;
  if (to === "F") return (c * 9) / 5 + 32;
  return c + 273.15;
}

export default function UnitConverter({ labels }: Props) {
  const [draft, setDraft, clear] = useToolDraft<Draft>("unit-converter", {
    mode: "length",
    from: "m",
    to: "km",
    value: "1",
  });

  const units = useMemo(() => {
    if (draft.mode === "length") return Object.keys(LENGTH);
    if (draft.mode === "weight") return Object.keys(WEIGHT);
    if (draft.mode === "data") return Object.keys(DATA);
    return ["C", "F", "K"];
  }, [draft.mode]);

  const result = useMemo(() => {
    const n = Number(draft.value);
    if (!Number.isFinite(n)) return "";
    if (draft.mode === "temperature") {
      return convertTemp(n, draft.from, draft.to).toFixed(6).replace(/\.?0+$/, "");
    }
    const table =
      draft.mode === "length" ? LENGTH : draft.mode === "weight" ? WEIGHT : DATA;
    const base = n * (table[draft.from] ?? 1);
    const out = base / (table[draft.to] ?? 1);
    return out.toPrecision(10).replace(/\.?0+$/, "");
  }, [draft]);

  function setMode(mode: Mode) {
    const defaults: Record<Mode, { from: string; to: string }> = {
      length: { from: "m", to: "km" },
      weight: { from: "kg", to: "lb" },
      temperature: { from: "C", to: "F" },
      data: { from: "MB", to: "GB" },
    };
    setDraft({ ...draft, mode, ...defaults[mode] });
  }

  const modes: { key: Mode; label: string }[] = [
    { key: "length", label: labels.length },
    { key: "weight", label: labels.weight },
    { key: "temperature", label: labels.temperature },
    { key: "data", label: labels.data },
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`min-h-11 rounded-xl px-4 text-sm font-medium ${
              draft.mode === m.key
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-slate-50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.value}</span>
          <input
            type="number"
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-400"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.from}</span>
          <select
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-400"
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.to}</span>
          <select
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-400"
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="rounded-2xl bg-blue-50 px-4 py-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          {labels.result}
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
          {result || "—"}
        </p>
      </div>
      <button type="button" onClick={clear} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
        {labels.clear}
      </button>
    </div>
  );
}
