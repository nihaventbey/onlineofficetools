"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadText, formatBytes, MAX_DOC_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["docxToHtml"] };

function isDocx(file: File): boolean {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

export default function DocxToHtml({ labels }: Props) {
  const [html, setHtml] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function convert(file: File) {
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
      const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      setHtml(result.value);
      setFileName(`${file.name} · ${formatBytes(file.size)}`);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <FileDropZone
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={(files) => void convert(files[0])}
        disabled={busy}
      />
      {fileName ? <p className="text-sm text-slate-600">{fileName}</p> : null}
      {busy ? <p className="text-sm text-slate-500">{labels.processing}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {html ? (
        <textarea
          value={html}
          readOnly
          rows={14}
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs outline-none"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadText(html, "document.html", "text/html")}
          disabled={!html}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {labels.download}
        </button>
        <button
          type="button"
          onClick={() => {
            setHtml("");
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
