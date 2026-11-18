"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob, downloadText } from "@/lib/files/utils";
import * as XLSX from "xlsx";

type Props = {
  labels: Dictionary["tools"]["jsonCsvConverter"];
};

const SAMPLE_JSON = JSON.stringify(
  [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Developer", city: "New York", salary: 95000 },
    { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Designer", city: "London", salary: 82000 },
    { id: 3, name: "Charlie Lee", email: "charlie@example.com", role: "Product Manager", city: "Berlin", salary: 105000 },
    { id: 4, name: "Diana Prince", email: "diana@example.com", role: "Data Scientist", city: "Tokyo", salary: 110000 },
  ],
  null,
  2
);

const SAMPLE_CSV = `id,name,email,role,city,salary
1,Alice Johnson,alice@example.com,Developer,New York,95000
2,Bob Smith,bob@example.com,Designer,London,82000
3,Charlie Lee,charlie@example.com,Product Manager,Berlin,105000
4,Diana Prince,diana@example.com,Data Scientist,Tokyo,110000`;

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value as Record<string, unknown>, fullKey));
    } else {
      flattened[fullKey] = value;
    }
  }
  return flattened;
}

export default function JsonCsvConverter({ labels }: Props) {
  const [tab, setTab] = useState<"jsonToCsv" | "csvToJson">("jsonToCsv");

  // JSON -> CSV state
  const [jsonInput, setJsonInput] = useState<string>(SAMPLE_JSON);
  const [flatten, setFlatten] = useState<boolean>(true);
  const [jsonError, setJsonError] = useState<string>("");
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);

  // CSV -> JSON state
  const [csvInput, setCsvInput] = useState<string>(SAMPLE_CSV);
  const [delimiter, setDelimiter] = useState<string>("auto");
  const [indent, setIndent] = useState<number>(2);
  const [csvError, setCsvError] = useState<string>("");
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Handlers for JSON to CSV
  function convertJsonToRows(): { headers: string[]; rows: (string | number | boolean | null)[][] } {
    if (!jsonInput.trim()) return { headers: [], rows: [] };
    try {
      const parsed = JSON.parse(jsonInput);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (!arr.length) return { headers: [], rows: [] };

      const processedArr = flatten
        ? arr.map((item) => (typeof item === "object" && item !== null ? flattenObject(item) : { value: item }))
        : arr;

      const headersSet = new Set<string>();
      for (const item of processedArr) {
        if (typeof item === "object" && item !== null) {
          Object.keys(item).forEach((k) => headersSet.add(k));
        }
      }
      const headers = Array.from(headersSet);

      const rows = processedArr.map((item) => {
        if (typeof item !== "object" || item === null) return [item];
        return headers.map((h) => {
          const val = (item as Record<string, unknown>)[h];
          return val === undefined || val === null ? "" : (val as string | number | boolean);
        });
      });

      return { headers, rows };
    } catch {
      return { headers: [], rows: [] };
    }
  }

  function generateCsv(): string {
    const { headers, rows } = convertJsonToRows();
    if (!headers.length) return "";

    const escapeVal = (val: unknown) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [headers.map(escapeVal).join(",")];
    for (const row of rows) {
      lines.push(row.map(escapeVal).join(","));
    }
    return lines.join("\n");
  }

  function downloadCsvFile() {
    try {
      setJsonError("");
      const csv = generateCsv();
      if (!csv) throw new Error("No valid data to export.");
      downloadText(csv, "data.csv", "text/csv;charset=utf-8;");
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON input");
    }
  }

  function downloadXlsxFile() {
    try {
      setJsonError("");
      const { headers, rows } = convertJsonToRows();
      if (!headers.length) throw new Error("No valid data to export.");

      const sheetData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, "data.xlsx");
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON input");
    }
  }

  function copyCsv() {
    try {
      setJsonError("");
      const csv = generateCsv();
      if (!csv) throw new Error("No valid data to copy.");
      void navigator.clipboard.writeText(csv);
      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 2000);
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  function beautifyJson() {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setJsonError("");
    } catch {
      setJsonError("Invalid JSON format.");
    }
  }

  // Handlers for CSV to JSON
  function detectDelimiter(text: string): string {
    if (delimiter !== "auto") return delimiter;
    const firstLine = text.split("\n")[0] || "";
    const counts = {
      ",": (firstLine.match(/,/g) || []).length,
      ";": (firstLine.match(/;/g) || []).length,
      "\t": (firstLine.match(/\t/g) || []).length,
      "|": (firstLine.match(/\|/g) || []).length,
    };
    let best = ",";
    let max = -1;
    for (const [d, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        best = d;
      }
    }
    return best;
  }

  function convertCsvToJsonString(): string {
    if (!csvInput.trim()) return "";
    try {
      const sep = detectDelimiter(csvInput);
      const lines = csvInput.trim().split(/\r?\n/);
      if (lines.length < 2) return "[]";

      // Simple CSV row parser handling quotes
      const parseLine = (line: string): string[] => {
        const result: string[] = [];
        let curr = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' && line[i + 1] === '"') {
            curr += '"';
            i++;
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === sep && !inQuotes) {
            result.push(curr.trim());
            curr = "";
          } else {
            curr += char;
          }
        }
        result.push(curr.trim());
        return result;
      };

      const headers = parseLine(lines[0]);
      const objects: Record<string, string | number | boolean | null>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const vals = parseLine(line);
        const obj: Record<string, string | number | boolean | null> = {};
        headers.forEach((h, idx) => {
          const raw = vals[idx] ?? "";
          if (raw === "") {
            obj[h] = null;
          } else if (raw.toLowerCase() === "true") {
            obj[h] = true;
          } else if (raw.toLowerCase() === "false") {
            obj[h] = false;
          } else if (!isNaN(Number(raw)) && raw.trim() !== "") {
            obj[h] = Number(raw);
          } else {
            obj[h] = raw;
          }
        });
        objects.push(obj);
      }

      return JSON.stringify(objects, null, indent);
    } catch {
      return "[]";
    }
  }

  function downloadJsonFile() {
    try {
      setCsvError("");
      const json = convertCsvToJsonString();
      if (!json || json === "[]") throw new Error("No CSV data to convert.");
      downloadText(json, "data.json", "application/json");
    } catch (err: unknown) {
      setCsvError(err instanceof Error ? err.message : "Error converting CSV");
    }
  }

  function copyJson() {
    try {
      setCsvError("");
      const json = convertCsvToJsonString();
      if (!json) throw new Error("No data to copy.");
      void navigator.clipboard.writeText(json);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err: unknown) {
      setCsvError(err instanceof Error ? err.message : "Error copying JSON");
    }
  }

  const { headers: previewHeaders, rows: previewRows } = convertJsonToRows();
  const jsonResultStr = convertCsvToJsonString();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("jsonToCsv")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            tab === "jsonToCsv"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {labels.tabJsonToCsv || "JSON ➔ CSV / Excel"}
        </button>
        <button
          type="button"
          onClick={() => setTab("csvToJson")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            tab === "csvToJson"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {labels.tabCsvToJson || "CSV ➔ JSON"}
        </button>
      </div>

      {/* Tab 1: JSON to CSV / Excel */}
      {tab === "jsonToCsv" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-sm font-bold text-slate-800">
                {labels.jsonInputLabel || "Input JSON Array or Object"}
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setJsonInput(SAMPLE_JSON)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 hover:bg-slate-100"
                >
                  {labels.loadSample || "Load Sample"}
                </button>
                <button
                  type="button"
                  onClick={beautifyJson}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 hover:bg-slate-100"
                >
                  {labels.beautify || "Beautify"}
                </button>
                <button
                  type="button"
                  onClick={() => setJsonInput("")}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-red-600 hover:bg-red-50"
                >
                  {labels.clear || "Clear"}
                </button>
              </div>
            </div>

            <textarea
              rows={9}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="[{ id: 1, name: 'Alice' }, ...]"
              className="w-full font-mono text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flatten}
                  onChange={(e) => setFlatten(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                {labels.flattenNested || "Flatten nested objects (e.g. user.address.city)"}
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copyCsv}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  {copiedCsv ? "✓ Copied CSV!" : labels.copyCsv || "Copy CSV"}
                </button>
                <button
                  type="button"
                  onClick={downloadCsvFile}
                  className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  ⬇ {labels.downloadCsv || "Download CSV"}
                </button>
                <button
                  type="button"
                  onClick={downloadXlsxFile}
                  className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  📊 {labels.downloadExcel || "Download Excel (.xlsx)"}
                </button>
              </div>
            </div>

            {jsonError && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {jsonError}
              </p>
            )}
          </div>

          {/* Table Preview */}
          {previewHeaders.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {labels.tablePreview || "Table Preview"} ({previewRows.length} {labels.rows || "rows"}, {previewHeaders.length} {labels.columns || "columns"})
                </span>
              </div>
              <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200 sticky top-0">
                    <tr>
                      {previewHeaders.map((h) => (
                        <th key={h} className="px-3 py-2 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.slice(0, 50).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 whitespace-nowrap font-mono text-[11px]">
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: CSV to JSON */}
      {tab === "csvToJson" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-sm font-bold text-slate-800">
                {labels.csvInputLabel || "Input CSV Data"}
              </label>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-700"
                >
                  <option value="auto">Auto Delimiter</option>
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="&#9;">Tab</option>
                  <option value="|">Pipe (|)</option>
                </select>
                <select
                  value={indent}
                  onChange={(e) => setIndent(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-700"
                >
                  <option value={2}>2 Spaces Indent</option>
                  <option value={4}>4 Spaces Indent</option>
                  <option value={0}>Minified</option>
                </select>
                <button
                  type="button"
                  onClick={() => setCsvInput(SAMPLE_CSV)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 hover:bg-slate-100"
                >
                  {labels.loadSample || "Load Sample"}
                </button>
                <button
                  type="button"
                  onClick={() => setCsvInput("")}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-red-600 hover:bg-red-50"
                >
                  {labels.clear || "Clear"}
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="id,name,role..."
              className="w-full font-mono text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            {csvError && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {csvError}
              </p>
            )}

            {/* JSON Output */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {labels.jsonOutputLabel || "Generated JSON Result"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyJson}
                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                  >
                    {copiedJson ? "✓ Copied!" : labels.copyJson || "Copy JSON"}
                  </button>
                  <button
                    type="button"
                    onClick={downloadJsonFile}
                    className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                  >
                    ⬇ {labels.downloadJson || "Download .json"}
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                rows={9}
                value={jsonResultStr}
                className="w-full font-mono text-xs rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
