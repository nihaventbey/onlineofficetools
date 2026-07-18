"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";
import { downloadBlob, MAX_DOC_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["csvToXlsx"] };

export default function CsvToXlsx({ labels }: Props) {
  const [csv, setCsv, clear] = useToolDraft("csv-to-xlsx", "Name,Email\nAlice,alice@example.com\nBob,bob@example.com");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function convertCsv(text: string) {
    setBusy(true);
    setError("");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(text, { type: "string" });
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      downloadBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "data.xlsx");
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File) {
    if (file.size > MAX_DOC_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    const text = await file.text();
    setCsv(text);
    await convertCsv(text);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <FileDropZone
        accept=".csv,text/csv"
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={(files) => void onFile(files[0])}
        disabled={busy}
      />
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        placeholder={labels.placeholder}
        rows={12}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs outline-none focus:border-blue-400"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void convertCsv(csv)}
          disabled={busy || !csv.trim()}
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
