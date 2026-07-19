"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { estimatePageFit, type FitFont } from "@/lib/ebys/pageFitEstimate";
import {
  plainTextToBelgenetHtml,
  sanitizeBelgenetHtml,
} from "@/lib/ebys/sanitizeBelgenetHtml";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["belgenetHtml"] };
type Tab = "visual" | "code";

const SAMPLE =
  "<p>Konu: Örnek resmi yazı</p><p>İlgi yazınız incelenmiştir.</p><p>Gereğini arz ederim.</p>";

export default function BelgenetHtml({ labels }: Props) {
  const [html, setHtml, clear] = useToolDraft("belgenet-html", SAMPLE);
  const [tab, setTab] = useState<Tab>("visual");
  const [font, setFont] = useState<FitFont>("times");
  const [fontSize, setFontSize] = useState(12);
  const [copied, setCopied] = useState(false);
  const visualRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  const debounceRef = useRef<number | null>(null);
  const htmlRef = useRef(html);
  htmlRef.current = html;

  const fit = useMemo(
    () => estimatePageFit({ html, font, fontSizePt: fontSize }),
    [html, font, fontSize],
  );

  const fontFamily =
    font === "times" ? '"Times New Roman", Times, serif' : "Arial, Helvetica, sans-serif";

  const syncVisual = useCallback(() => {
    const el = visualRef.current;
    if (!el || syncingRef.current) return;
    syncingRef.current = true;
    el.innerHTML = sanitizeBelgenetHtml(html) || "<p><br></p>";
    syncingRef.current = false;
  }, [html]);

  useEffect(() => {
    syncVisual();
  }, [syncVisual]);

  function onCodeChange(value: string) {
    setHtml(value);
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
      setHtml(sanitizeBelgenetHtml(el.innerHTML));
      syncingRef.current = false;
    }, 200);
  }

  function fromPlain() {
    const plain = window.prompt(labels.placeholder, "");
    if (plain == null) return;
    setHtml(plainTextToBelgenetHtml(plain));
  }

  async function handleCopy() {
    const clean = sanitizeBelgenetHtml(html);
    try {
      await navigator.clipboard.writeText(clean);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            {labels.fontLabel}
          </label>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value as FitFont)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="times">{labels.fontTimes}</option>
            <option value="arial">{labels.fontArial}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            {labels.sizeLabel}: {fontSize} pt
          </label>
          <input
            type="range"
            min={9}
            max={12}
            step={1}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
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
          value={html}
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
          style={{ fontFamily, fontSize: `${fontSize}pt`, lineHeight: 1.15 }}
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

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="min-h-10 rounded-xl bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-600"
        >
          {copied ? labels.copied : labels.copyHtml}
        </button>
        <button
          type="button"
          onClick={clear}
          className="min-h-10 rounded-xl px-4 text-sm font-medium text-slate-500 hover:bg-slate-50"
        >
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
