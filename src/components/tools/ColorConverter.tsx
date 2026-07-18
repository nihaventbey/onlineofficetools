"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["colorConverter"] };
type Draft = { hex: string };

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export default function ColorConverter({ labels }: Props) {
  const [draft, setDraft, clear] = useToolDraft<Draft>("color-converter", {
    hex: "#2563eb",
  });
  const [copied, setCopied] = useState(false);

  const rgb = useMemo(() => hexToRgb(draft.hex), [draft.hex]);
  const hsl = useMemo(
    () => (rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null),
    [rgb],
  );

  const normalized = rgb
    ? `#${[rgb.r, rgb.g, rgb.b]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")}`
    : draft.hex;

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="color"
          value={rgb ? normalized : "#2563eb"}
          onChange={(e) => setDraft({ hex: e.target.value })}
          className="h-14 w-20 cursor-pointer rounded-xl border border-slate-200 bg-white"
          aria-label={labels.picker}
        />
        <label className="flex-1 text-sm">
          <span className="mb-1 block font-medium">{labels.hex}</span>
          <input
            value={draft.hex}
            onChange={(e) => setDraft({ hex: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm outline-none focus:border-blue-400"
          />
        </label>
      </div>
      <div
        className="h-24 rounded-2xl border border-slate-200"
        style={{ background: rgb ? normalized : "#e2e8f0" }}
      />
      {rgb && hsl ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: labels.hex, value: normalized },
            { label: labels.rgb, value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
            {
              label: labels.hsl,
              value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
            },
          ].map((row) => (
            <button
              key={row.label}
              type="button"
              onClick={() => copy(row.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-sm hover:border-blue-300"
            >
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {row.label}
              </span>
              <span className="mt-1 block font-mono text-slate-900">{row.value}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-red-600">{labels.invalid}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => rgb && copy(normalized)}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500"
        >
          {copied ? labels.copied : labels.copy}
        </button>
        <button
          type="button"
          onClick={() => {
            clear();
            setDraft({ hex: "#2563eb" });
          }}
          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
        >
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
