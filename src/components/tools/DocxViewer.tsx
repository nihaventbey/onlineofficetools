"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { formatBytes, MAX_DOC_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["docxViewer"] };

function isDocx(file: File): boolean {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

export default function DocxViewer({ labels }: Props) {
  const [html, setHtml] = useState("");
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function loadDocx(file: File) {
    if (!isDocx(file)) {
      setError(labels.invalidFile);
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const mammoth = await import("mammoth");
      const buf = await file.arrayBuffer();
      const [htmlResult, textResult] = await Promise.all([
        mammoth.convertToHtml({ arrayBuffer: buf }),
        mammoth.extractRawText({ arrayBuffer: buf }),
      ]);
      setHtml(htmlResult.value);
      setRawText(textResult.value.trim());
      setFileName(`${file.name} · ${formatBytes(file.size)}`);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(rawText);
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
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={(files) => void loadDocx(files[0])}
        disabled={busy}
      />
      {fileName ? <p className="text-sm text-slate-600">{fileName}</p> : null}
      {busy ? <p className="text-sm text-slate-500">{labels.processing}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {html ? (
        <div
          className="prose prose-slate max-w-none rounded-xl border border-slate-200 bg-white p-4 text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
      {rawText ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{labels.extract}</p>
          <textarea
            value={rawText}
            readOnly
            rows={8}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleCopy} disabled={!rawText} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40">
          {copied ? labels.copied : labels.copy}
        </button>
        <button
          type="button"
          onClick={() => {
            setHtml("");
            setRawText("");
            setFileName("");
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
