"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["htmlEditor"] };

const SAMPLE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui; padding: 1.5rem; color: #0f172a; }
    h1 { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Hello</h1>
  <p>Edit HTML on the left to preview here.</p>
</body>
</html>`;

/**
 * Bidirectional editor: code textarea ↔ contentEditable body panel.
 * Supported visual subset: basic block/inline tags (p, h1–h3, strong, em, ul/ol/li, a).
 * Scripts/styles in head are preserved in code but not executed in the visual panel.
 * Optional sandbox iframe preview shows full document rendering without script execution.
 */
function extractBody(html: string): string {
  const match = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  return match ? match[1] : html;
}

function replaceBody(html: string, bodyInner: string): string {
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/(<body[^>]*>)([\s\S]*?)(<\/body>)/i, `$1${bodyInner}$3`);
  }
  return bodyInner;
}

type Tab = "code" | "visual";

export default function HtmlEditor({ labels }: Props) {
  const [html, setHtml, clear] = useToolDraft("html-editor", SAMPLE);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<Tab>("code");
  const [showSandbox, setShowSandbox] = useState(false);
  const visualRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  const debounceRef = useRef<number | null>(null);
  const htmlRef = useRef(html);
  htmlRef.current = html;

  const syncVisualFromCode = useCallback(() => {
    const el = visualRef.current;
    if (!el || syncingRef.current) return;
    syncingRef.current = true;
    el.innerHTML = extractBody(html);
    syncingRef.current = false;
  }, [html]);

  useEffect(() => {
    syncVisualFromCode();
  }, [syncVisualFromCode]);

  function onCodeChange(value: string) {
    syncingRef.current = true;
    setHtml(value);
    if (visualRef.current) {
      visualRef.current.innerHTML = extractBody(value);
    }
    syncingRef.current = false;
  }

  function onVisualInput() {
    if (syncingRef.current) return;
    const el = visualRef.current;
    if (!el) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      syncingRef.current = true;
      setHtml(replaceBody(htmlRef.current, el.innerHTML));
      syncingRef.current = false;
    }, 250);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const codePanel = (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{labels.editor}</p>
      <textarea
        value={html}
        onChange={(e) => onCodeChange(e.target.value)}
        rows={18}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs outline-none focus:border-blue-400"
        spellCheck={false}
      />
    </div>
  );

  const visualPanel = (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{labels.preview}</p>
      <div
        ref={visualRef}
        contentEditable
        suppressContentEditableWarning
        onInput={onVisualInput}
        className="min-h-[28rem] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 prose prose-slate max-w-none"
      />
    </div>
  );

  const sandboxPanel = showSandbox ? (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-2">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Sandbox preview</p>
      <iframe
        title="Sandbox preview"
        sandbox=""
        srcDoc={html}
        className="h-64 w-full rounded-xl border border-slate-200 bg-white lg:h-80"
      />
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 lg:hidden">
        {(["code", "visual"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`min-h-11 rounded-xl px-4 text-sm font-medium ${
              tab === t ? "bg-blue-600 text-white" : "border border-slate-200"
            }`}
          >
            {t === "code" ? labels.editor : labels.preview}
          </button>
        ))}
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
        {codePanel}
        {visualPanel}
      </div>

      <div className="lg:hidden">
        {tab === "code" ? codePanel : visualPanel}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={showSandbox} onChange={(e) => setShowSandbox(e.target.checked)} />
        Show optional sandbox iframe preview
      </label>
      {sandboxPanel}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleCopy} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500">
          {copied ? labels.copied : labels.copy}
        </button>
        <button type="button" onClick={() => setHtml(SAMPLE)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.reset}
        </button>
        <button type="button" onClick={clear} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
