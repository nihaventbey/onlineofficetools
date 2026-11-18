"use client";

import { useState, useMemo } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";
import { downloadBlob, downloadText, formatBytes, MAX_DOC_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";
import * as XLSX from "xlsx";

type Props = { labels: Dictionary["tools"]["csvEditor"] };

type SheetData = {
  name: string;
  rows: string[][];
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || (c === "\r" && text[i + 1] === "\n")) {
      row.push(cell);
      cell = "";
      if (row.some((v) => v.length)) rows.push(row);
      row = [];
      if (c === "\r") i++;
    } else {
      cell += c;
    }
  }
  row.push(cell);
  if (row.some((v) => v.length)) rows.push(row);
  return rows.length ? rows : [[""]];
}

function serializeCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
          return cell;
        })
        .join(","),
    )
    .join("\n");
}

export default function CsvEditor({ labels }: Props) {
  const [csvText, setCsvText, clearDraft] = useToolDraft(
    "csv-editor",
    "Item,Category,Price,Quantity\nLaptop,Electronics,1200,5\nMouse,Electronics,25,40\nCoffee Mug,Office,12,100"
  );

  const [sheets, setSheets] = useState<SheetData[]>([
    {
      name: "Sheet1",
      rows: parseCsv(
        "Item,Category,Price,Quantity\nLaptop,Electronics,1200,5\nMouse,Electronics,25,40\nCoffee Mug,Office,12,100"
      ),
    },
  ]);
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "raw">("grid");

  const currentSheet = sheets[activeSheetIdx] || sheets[0];
  const currentRows = currentSheet.rows;

  function handleFile(file: File) {
    setError("");
    if (file.size > MAX_DOC_BYTES) {
      setError(labels.tooLarge || "File too large");
      return;
    }

    const isExcel =
      file.name.toLowerCase().endsWith(".xlsx") ||
      file.name.toLowerCase().endsWith(".xls") ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (e) => {
        try {
          const data = e.target?.result as ArrayBuffer;
          const wb = XLSX.read(data, { type: "array" });
          const newSheets: SheetData[] = wb.SheetNames.map((sName) => {
            const ws = wb.Sheets[sName];
            const rawAoa = XLSX.utils.sheet_to_json<string[]>(ws, {
              header: 1,
              defval: "",
            }) as string[][];
            return {
              name: sName,
              rows: rawAoa.length > 0 ? rawAoa : [[""]],
            };
          });

          if (newSheets.length > 0) {
            setSheets(newSheets);
            setActiveSheetIdx(0);
            setFileName(`${file.name} (${formatBytes(file.size)})`);
            setCsvText(serializeCsv(newSheets[0].rows));
          }
        } catch {
          setError(labels.error || "Failed to parse Excel file.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV or plain text
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = parseCsv(text);
          setSheets([{ name: "Sheet1", rows: parsed }]);
          setActiveSheetIdx(0);
          setFileName(`${file.name} (${formatBytes(file.size)})`);
          setCsvText(text);
        } catch {
          setError(labels.error || "Failed to parse CSV file.");
        }
      };
      reader.readAsText(file);
    }
  }

  function updateCell(r: number, c: number, value: string) {
    const nextRows = currentRows.map((row) => [...row]);
    while (nextRows[r].length <= c) nextRows[r].push("");
    nextRows[r][c] = value;

    setSheets((prev) =>
      prev.map((s, idx) => (idx === activeSheetIdx ? { ...s, rows: nextRows } : s))
    );
    if (activeSheetIdx === 0) setCsvText(serializeCsv(nextRows));
  }

  function addRow() {
    const cols = Math.max(1, ...currentRows.map((r) => r.length));
    const nextRows = [...currentRows, Array.from({ length: cols }, () => "")];
    setSheets((prev) =>
      prev.map((s, idx) => (idx === activeSheetIdx ? { ...s, rows: nextRows } : s))
    );
    if (activeSheetIdx === 0) setCsvText(serializeCsv(nextRows));
  }

  function addCol() {
    const nextRows = currentRows.map((row) => [...row, ""]);
    setSheets((prev) =>
      prev.map((s, idx) => (idx === activeSheetIdx ? { ...s, rows: nextRows } : s))
    );
    if (activeSheetIdx === 0) setCsvText(serializeCsv(nextRows));
  }

  function deleteRow(rIdx: number) {
    if (currentRows.length <= 1) return;
    const nextRows = currentRows.filter((_, idx) => idx !== rIdx);
    setSheets((prev) =>
      prev.map((s, idx) => (idx === activeSheetIdx ? { ...s, rows: nextRows } : s))
    );
    if (activeSheetIdx === 0) setCsvText(serializeCsv(nextRows));
  }

  function addSheet() {
    const newName = `Sheet${sheets.length + 1}`;
    setSheets([...sheets, { name: newName, rows: [[""]] }]);
    setActiveSheetIdx(sheets.length);
  }

  function downloadCsv() {
    const csv = serializeCsv(currentRows);
    const baseName = fileName ? fileName.replace(/\.[^.]+$/, "") : "spreadsheet";
    downloadText(csv, `${baseName}-${currentSheet.name}.csv`, "text/csv;charset=utf-8;");
  }

  function downloadExcel() {
    const wb = XLSX.utils.book_new();
    sheets.forEach((sheet) => {
      const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const baseName = fileName ? fileName.replace(/\.[^.]+$/, "") : "spreadsheet";
    downloadBlob(blob, `${baseName}.xlsx`);
  }

  // Filtered rows for search preview
  const displayRows = useMemo(() => {
    if (!searchTerm.trim()) return currentRows;
    const q = searchTerm.toLowerCase();
    return currentRows.filter((r) => r.some((c) => c.toLowerCase().includes(q)));
  }, [currentRows, searchTerm]);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Top Banner & Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {labels.title || "Spreadsheet & CSV Studio"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {fileName || (labels.limitHint || "Edit, convert, and manage Excel (.xlsx) and CSV files directly in your browser.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "grid" ? "raw" : "grid")}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            {viewMode === "grid" ? "📄 Raw CSV View" : "📊 Grid View"}
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            ⬇ {labels.download || "Download CSV"}
          </button>
          <button
            type="button"
            onClick={downloadExcel}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            📊 Download Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* File Dropzone */}
      <FileDropZone
        accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        dropHint={labels.dropHint || "Drop CSV or Excel (.xlsx / .xls) file here"}
        selectHint={labels.selectHint ?? "Supports .csv, .xlsx, .xls"}
        onFiles={(files) => handleFile(files[0])}
      />

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </p>
      ) : null}

      {/* Sheet Tabs & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pt-1">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {sheets.map((sheet, sIdx) => (
            <button
              key={sheet.name + sIdx}
              type="button"
              onClick={() => setActiveSheetIdx(sIdx)}
              className={`rounded-t-lg border-b-2 px-3.5 py-1.5 text-xs font-semibold transition ${
                sIdx === activeSheetIdx
                  ? "border-indigo-600 bg-indigo-50/50 text-indigo-700"
                  : "border-transparent text-slate-600 hover:bg-slate-50"
              }`}
            >
              📑 {sheet.name}
            </button>
          ))}
          <button
            type="button"
            onClick={addSheet}
            className="rounded-lg border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
            title="Add new sheet"
          >
            + Sheet
          </button>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cells..."
            className="rounded-lg border border-slate-300 py-1 pl-2.5 pr-6 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-1.5 top-1.5 text-[10px] text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* View Mode: Raw CSV or Interactive Grid */}
      {viewMode === "raw" ? (
        <textarea
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            const parsed = parseCsv(e.target.value);
            setSheets((prev) =>
              prev.map((s, idx) => (idx === activeSheetIdx ? { ...s, rows: parsed } : s))
            );
          }}
          placeholder={labels.placeholder}
          rows={12}
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs outline-none focus:border-indigo-500"
        />
      ) : (
        <div className="space-y-2">
          <div className="max-h-[500px] overflow-auto rounded-xl border border-slate-200 shadow-inner">
            <table className="min-w-full text-left text-xs divide-y divide-slate-100">
              <thead className="sticky top-0 z-10 bg-slate-100 font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="w-10 px-2 py-1 text-center font-mono text-[10px] text-slate-400 border-r border-slate-200">
                    #
                  </th>
                  {currentRows[0]?.map((_, ci) => (
                    <th key={ci} className="px-3 py-1.5 font-mono text-[11px] border-r border-slate-200">
                      {String.fromCharCode(65 + (ci % 26))}
                    </th>
                  ))}
                  <th className="w-8 px-2 py-1 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {displayRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-slate-50/80">
                    <td className="w-10 bg-slate-50 px-2 py-1 text-center font-mono text-[10px] text-slate-400 border-r border-slate-200 select-none">
                      {ri + 1}
                    </td>
                    {row.map((cell, ci) => (
                      <td key={ci} className="p-0 border-r border-slate-100">
                        <input
                          value={cell}
                          onChange={(e) => updateCell(ri, ci, e.target.value)}
                          className="w-full min-w-28 border-0 bg-transparent px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-indigo-50/70 focus:ring-1 focus:ring-indigo-400"
                        />
                      </td>
                    ))}
                    <td className="w-8 text-center">
                      <button
                        type="button"
                        onClick={() => deleteRow(ri)}
                        className="text-slate-300 hover:text-red-500 transition px-1"
                        title="Delete row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
            <span>
              {currentRows.length} rows • {currentRows[0]?.length || 0} columns
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addRow}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700 hover:bg-slate-100"
              >
                + {labels.addRow || "Add Row"}
              </button>
              <button
                type="button"
                onClick={addCol}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700 hover:bg-slate-100"
              >
                + {labels.addCol || "Add Column"}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearDraft();
                  setSheets([{ name: "Sheet1", rows: [[""]] }]);
                  setFileName("");
                  setError("");
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-red-600 hover:bg-red-50"
              >
                {labels.clear || "Clear Table"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
