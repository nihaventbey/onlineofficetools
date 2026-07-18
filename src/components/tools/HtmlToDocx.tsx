"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";
import { downloadBlob } from "@/lib/files/utils";

type Props = { labels: Dictionary["tools"]["htmlToDocx"] };

function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n");
  return (tmp.textContent ?? tmp.innerText ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

export default function HtmlToDocx({ labels }: Props) {
  const [html, setHtml, clear] = useToolDraft("html-to-docx", "<h1>Title</h1>\n<p>Paragraph text.</p>");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const docx = await import("docx");
      const plain = stripHtml(html);
      const lines = plain.split(/\r\n|\r|\n/).filter((line) => line.length > 0);
      const children = (lines.length ? lines : [""]).map(
        (line) =>
          new docx.Paragraph({
            children: [new docx.TextRun(line)],
          }),
      );
      const document = new docx.Document({
        sections: [{ children }],
      });
      const blob = await docx.Packer.toBlob(document);
      downloadBlob(blob, "document.docx");
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <textarea
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        placeholder={labels.placeholder}
        rows={14}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs outline-none focus:border-blue-400"
        spellCheck={false}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {labels.download}
        </button>
        <button type="button" onClick={clear} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
