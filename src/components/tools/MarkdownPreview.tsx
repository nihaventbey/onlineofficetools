"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["markdownPreview"] };

const SAMPLE = `# Hello Markdown

Write **bold**, *italic*, or a list:

- One
- Two
- Three

\`\`\`js
console.log("preview");
\`\`\`
`;

export default function MarkdownPreview({ labels }: Props) {
  const [md, setMd, clear] = useToolDraft("markdown-preview", SAMPLE);
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const { marked } = await import("marked");
        const out = await marked.parse(md, { async: true });
        if (!cancelled) setHtml(typeof out === "string" ? out : String(out));
      } catch {
        if (!cancelled) setHtml("");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [md]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const framed = `<!DOCTYPE html><html><head><style>
    body{font-family:system-ui,sans-serif;padding:1.25rem;color:#0f172a;line-height:1.6}
    pre{background:#f1f5f9;padding:.75rem;border-radius:.5rem;overflow:auto}
    code{font-family:ui-monospace,monospace}
    a{color:#2563eb}
  </style></head><body>${html}</body></html>`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {labels.editor}
          </p>
          <textarea
            value={md}
            onChange={(e) => setMd(e.target.value)}
            rows={18}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm outline-none focus:border-blue-400"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {labels.preview}
          </p>
          <iframe
            title={labels.preview}
            sandbox=""
            srcDoc={framed}
            className="h-[28rem] w-full rounded-xl border border-slate-200 bg-white"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleCopy} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500">
          {copied ? labels.copied : labels.copy}
        </button>
        <button type="button" onClick={() => setMd(SAMPLE)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.reset}
        </button>
        <button type="button" onClick={clear} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
