"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { estimatePageFit } from "@/lib/ebys/pageFitEstimate";
import { useBelgenetDraft } from "@/lib/ebys/belgenetDraft";
import {
  plainTextToBelgenetHtml,
  sanitizeBelgenetHtml,
} from "@/lib/ebys/sanitizeBelgenetHtml";

type Labels = Dictionary["tools"]["belgenetPrep"]["yazi"];
type Tab = "visual" | "code";

export default function YaziPanel({ labels }: { labels: Labels }) {
  const { draft, setDraft } = useBelgenetDraft();
  const [tab, setTab] = useState<Tab>("visual");
  const [copied, setCopied] = useState(false);
  const visualRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  const fit = useMemo(
    () =>
      estimatePageFit({
        html: draft.html,
        font: draft.font,
        fontSizePt: draft.fontSize,
      }),
    [draft.html, draft.font, draft.fontSize],
  );

  const fontFamily =
    draft.font === "times"
      ? '"Times New Roman", Times, serif'
      : "Arial, Helvetica, sans-serif";

  const syncVisual = useCallback(() => {
    const el = visualRef.current;
    if (!el || syncingRef.current) return;
    syncingRef.current = true;
    el.innerHTML = sanitizeBelgenetHtml(draft.html) || "<p><br></p>";
    syncingRef.current = false;
  }, [draft.html]);

  useEffect(() => {
    syncVisual();
  }, [syncVisual]);

  function onCodeChange(value: string) {
    setDraft({ html: value });
    if (visualRef.current) {
      syncingRef.current = true;
      visualRef.current.innerHTML =
        sanitizeBelgenetHtml(value) || "<p><br></p>";
      syncingRef.current = false;
    }
  }

  function onVisualInput() {
    if (syncingRef.current) return;
    const el = visualRef.current;
    if (!el) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      syncingRef.current = true;
      setDraft({ html: sanitizeBelgenetHtml(el.innerHTML) });
      syncingRef.current = false;
    }, 200);
  }

  function fromPlain() {
    const plain = window.prompt(labels.placeholder, "");
    if (plain == null) return;
    setDraft({ html: plainTextToBelgenetHtml(plain) });
  }

  async function handleCopy() {
    const clean = sanitizeBelgenetHtml(draft.html);
    try {
      await navigator.clipboard.writeText(clean);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            {labels.fontLabel}
          </label>
          <select
            value={draft.font}
            onChange={(e) =>
              setDraft({ font: e.target.value as "times" | "arial" })
            }
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="times">{labels.fontTimes}</option>
            <option value="arial">{labels.fontArial}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            {labels.sizeLabel}: {draft.fontSize} pt
          </label>
          <input
            type="range"
            min={9}
            max={12}
            step={1}
            value={draft.fontSize}
            onChange={(e) => setDraft({ fontSize: Number(e.target.value) })}
            className="w-40"
          />
        </div>
        <button
          type="button"
          onClick={fromPlain}
          className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {labels.placeholder}
        </button>
      </div>

      <div className="flex gap-2">
        {(
          [
            ["visual", labels.tabVisual],
            ["code", labels.tabCode],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`min-h-9 rounded-lg px-3 text-sm font-semibold ${
              tab === key
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "code" ? (
        <textarea
          value={draft.html}
          onChange={(e) => onCodeChange(e.target.value)}
          rows={12}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs outline-none ring-amber-400 focus:ring-2"
        />
      ) : (
        <div
          ref={visualRef}
          contentEditable
          suppressContentEditableWarning
          onInput={onVisualInput}
          className="min-h-48 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-amber-400 focus:ring-2"
          style={{
            fontFamily,
            fontSize: `${draft.fontSize}pt`,
            lineHeight: 1.15,
          }}
        />
      )}

      <div
        className={`rounded-xl border px-4 py-3 ${
          fit.fitsFirstPage
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <p className="text-sm font-semibold text-slate-900">
          {labels.fitHeading}
        </p>
        <p className="mt-1 text-sm text-slate-800">
          {fit.fitsFirstPage ? labels.fitOk : labels.fitOverflow}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {labels.fitEstimate
            .replace("{height}", fit.estimatedHeightMm.toFixed(0))
            .replace("{page}", fit.pageHeightMm.toFixed(0))
            .replace("{pct}", Math.round(fit.utilization * 100).toString())}
        </p>
        <p className="mt-1 text-xs text-slate-500">{labels.fitNote}</p>
      </div>

      <p className="text-xs text-slate-500">{labels.sanitizeNote}</p>

      <button
        type="button"
        onClick={handleCopy}
        className="min-h-10 rounded-xl bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-600"
      >
        {copied ? labels.copied : labels.copyHtml}
      </button>
    </div>
  );
}
