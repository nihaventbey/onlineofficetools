"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadText, formatBytes, MAX_DOC_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["xlsxToCsv"] };

function isXlsx(file: File): boolean {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.name.toLowerCase().endsWith(".xlsx") ||
    file.name.toLowerCase().endsWith(".xls")
  );
}

export default function XlsxToCsv({ labels }: Props) {
  const [workbook, setWorkbook] = useState<import("xlsx").WorkBook | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function sheetToCsv(wb: import("xlsx").WorkBook, name: string, XLSX: typeof import("xlsx")) {
    const sheet = wb.Sheets[name];
    setActiveSheet(name);
    setCsv(XLSX.utils.sheet_to_csv(sheet));
  }

  async function loadWorkbook(file: File) {
    if (!isXlsx(file)) {
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
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      setWorkbook(wb);
      setSheets(wb.SheetNames);
      setFileName(`${file.name} · ${formatBytes(file.size)}`);
      if (wb.SheetNames[0]) sheetToCsv(wb, wb.SheetNames[0], XLSX);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function onSheetChange(name: string) {
    if (!workbook) return;
    const XLSX = await import("xlsx");
    sheetToCsv(workbook, name, XLSX);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <FileDropZone
        accept=".xlsx,.xls"
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={(files) => void loadWorkbook(files[0])}
        disabled={busy}
      />
      {fileName ? <p className="text-sm text-slate-600">{fileName}</p> : null}
      {sheets.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {sheets.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => void onSheetChange(name)}
              className={`min-h-9 rounded-lg px-3 text-sm font-medium ${
                activeSheet === name ? "bg-blue-600 text-white" : "border border-slate-200 bg-slate-50"
              }`}
            >
              {labels.sheet}: {name}
            </button>
          ))}
        </div>
      ) : null}
      {busy ? <p className="text-sm text-slate-500">{labels.processing}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {csv ? (
        <textarea
          value={csv}
          readOnly
          rows={12}
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs outline-none"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadText(csv, `${activeSheet || "sheet"}.csv`, "text/csv")}
          disabled={!csv}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {labels.download}
        </button>
        <button
          type="button"
          onClick={() => {
            setWorkbook(null);
            setSheets([]);
            setCsv("");
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
