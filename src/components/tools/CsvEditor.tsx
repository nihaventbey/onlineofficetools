"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";
import { downloadText } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["csvEditor"] };

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
  const [csvText, setCsvText, clearDraft] = useToolDraft("csv-editor", "Column A,Column B\n1,2\n3,4");
  const [rows, setRows] = useState<string[][]>(() => parseCsv("Column A,Column B\n1,2\n3,4"));
  const [error, setError] = useState("");

  function loadFromText(text: string) {
    setCsvText(text);
    setRows(parseCsv(text));
  }

  function updateCell(r: number, c: number, value: string) {
    const next = rows.map((row) => [...row]);
    while (next[r].length <= c) next[r].push("");
    next[r][c] = value;
    setRows(next);
    setCsvText(serializeCsv(next));
  }

  function addRow() {
    const cols = Math.max(1, ...rows.map((r) => r.length));
    const next = [...rows, Array.from({ length: cols }, () => "")];
    setRows(next);
    setCsvText(serializeCsv(next));
  }

  function addCol() {
    const next = rows.map((row) => [...row, ""]);
    setRows(next);
    setCsvText(serializeCsv(next));
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <FileDropZone
        accept=".csv,text/csv"
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={async (files) => {
          try {
            loadFromText(await files[0].text());
          } catch {
            setError(labels.error);
          }
        }}
      />
      <textarea
        value={csvText}
        onChange={(e) => loadFromText(e.target.value)}
        placeholder={labels.placeholder}
        rows={6}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs outline-none focus:border-blue-400"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-slate-100">
                {row.map((cell, ci) => (
                  <td key={ci} className="p-0">
                    <input
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className="w-full min-w-24 border-0 bg-transparent px-3 py-2 outline-none focus:bg-blue-50/60"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addRow} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.addRow}
        </button>
        <button type="button" onClick={addCol} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.addCol}
        </button>
        <button
          type="button"
          onClick={() => downloadText(serializeCsv(rows), "edited.csv", "text/csv")}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500"
        >
          {labels.download}
        </button>
        <button
          type="button"
          onClick={() => {
            clearDraft();
            setRows([[""]]);
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
