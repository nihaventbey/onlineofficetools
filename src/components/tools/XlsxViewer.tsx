"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { formatBytes, MAX_DOC_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["xlsxViewer"] };

const MAX_ROWS = 200;

function isXlsx(file: File): boolean {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.name.toLowerCase().endsWith(".xlsx") ||
    file.name.toLowerCase().endsWith(".xls")
  );
}

export default function XlsxViewer({ labels }: Props) {
  const [workbook, setWorkbook] = useState<import("xlsx").WorkBook | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function selectSheet(wb: import("xlsx").WorkBook, name: string, XLSX: typeof import("xlsx")) {
    const sheet = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
    setActiveSheet(name);
    setTotalRows(data.length);
    setRows(data.slice(0, MAX_ROWS));
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
      if (wb.SheetNames[0]) selectSheet(wb, wb.SheetNames[0], XLSX);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function onSheetChange(name: string) {
    if (!workbook) return;
    const XLSX = await import("xlsx");
    selectSheet(workbook, name, XLSX);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <FileDropZone
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
      ) : activeSheet ? (
        <p className="text-sm text-slate-600">
          {labels.sheet}: {activeSheet}
        </p>
      ) : null}
      {busy ? <p className="text-sm text-slate-500">{labels.processing}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {rows.length ? (
        <div className="overflow-auto rounded-xl border border-slate-200">
          <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {labels.rows}: {Math.min(rows.length, MAX_ROWS)} / {totalRows}
          </p>
          <table className="min-w-full text-left text-xs">
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="max-w-48 truncate px-3 py-2 text-slate-800">
                      {String(cell ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setWorkbook(null);
          setSheets([]);
          setRows([]);
          setFileName("");
          setError("");
        }}
        className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
      >
        {labels.clear}
      </button>
    </div>
  );
}
