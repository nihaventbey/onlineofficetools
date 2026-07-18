"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadText, formatBytes, MAX_DOC_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["pdfToText"] };

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export default function PdfToText({ labels }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [pages, setPages] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function extract(pdfFile: File) {
    if (!isPdfFile(pdfFile)) {
      setError(labels.invalidFile);
      return;
    }
    if (pdfFile.size > MAX_DOC_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    setBusy(true);
    setError("");
    setText("");
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const data = new Uint8Array(await pdfFile.arrayBuffer());
      const pdf = await pdfjs.getDocument({ data }).promise;
      setPages(pdf.numPages);
      const parts: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .trim();
        parts.push(`${labels.pages} ${i}\n${pageText}`);
      }
      const result = parts.join("\n\n").trim();
      setText(result || labels.empty);
      setFile(pdfFile);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <FileDropZone
        accept="application/pdf,.pdf"
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={(files) => void extract(files[0])}
        disabled={busy}
      />
      {file ? (
        <p className="text-sm text-slate-600">
          {file.name} · {formatBytes(file.size)}
          {pages ? ` · ${pages} ${labels.pages.toLowerCase()}` : ""}
        </p>
      ) : null}
      {busy ? <p className="text-sm text-slate-500">{labels.processing}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <textarea
        value={text}
        readOnly
        rows={14}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadText(text, "extracted.txt")}
          disabled={!text}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {labels.download}
        </button>
        <button type="button" onClick={handleCopy} disabled={!text} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium disabled:opacity-40">
          {copied ? labels.copied : labels.copy}
        </button>
        <button
          type="button"
          onClick={() => {
            setFile(null);
            setText("");
            setPages(0);
            setError("");
          }}
          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
        >
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
