"use client";

import { useState } from "react";
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

export default function HtmlEditor({ labels }: Props) {
  const [html, setHtml, clear] = useToolDraft("html-editor", SAMPLE);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {labels.editor}
          </p>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={18}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs outline-none focus:border-blue-400"
            spellCheck={false}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {labels.preview}
          </p>
          <iframe
            title={labels.preview}
            sandbox=""
            srcDoc={html}
            className="h-[28rem] w-full rounded-xl border border-slate-200 bg-white"
          />
        </div>
      </div>
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
