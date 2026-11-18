"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob, formatBytes, MAX_ZIP_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["zipViewer"] };

type EntryMeta = {
  path: string;
  dir: boolean;
  compressedSize: number;
  uncompressedSize: number;
};

function isZipFile(file: File): boolean {
  return (
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed" ||
    /\.zip$/i.test(file.name)
  );
}

function isTextPath(path: string): boolean {
  return /\.(txt|md|json|csv|html?|css|js|ts|xml|svg|log|yml|yaml)$/i.test(path);
}

function isImagePath(path: string): boolean {
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(path);
}

export default function ZipViewer({ labels }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<EntryMeta[]>([]);
  const [zipBytes, setZipBytes] = useState<ArrayBuffer | null>(null);
  const [zipFileName, setZipFileName] = useState("archive.zip");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [checkedPaths, setCheckedPaths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const appendInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function loadZip(file: File) {
    if (!isZipFile(file)) {
      setError(labels.invalidFile || "Invalid ZIP file");
      return;
    }
    if (file.size > MAX_ZIP_BYTES) {
      setError(labels.tooLarge || "File too large");
      return;
    }
    setBusy(true);
    setError("");
    setEntries([]);
    setSelectedPath(null);
    setCheckedPaths(new Set());
    setPreviewText("");
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      const buf = await file.arrayBuffer();
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buf);
      const next: EntryMeta[] = [];

      for (const path of Object.keys(zip.files).sort()) {
        const item = zip.files[path]!;
        const raw = item as unknown as {
          _data?: { uncompressedSize?: number; compressedSize?: number };
        };
        next.push({
          path,
          dir: item.dir,
          compressedSize: raw._data?.compressedSize ?? 0,
          uncompressedSize: raw._data?.uncompressedSize ?? 0,
        });
      }

      if (!next.length) {
        setError(labels.emptyZip || "Empty ZIP archive");
        return;
      }
      setZipBytes(buf);
      setZipFileName(file.name);
      setEntries(next);
    } catch {
      setError(labels.error || "Failed to read ZIP file");
    } finally {
      setBusy(false);
    }
  }

  async function preview(path: string) {
    if (!zipBytes) return;
    setBusy(true);
    setError("");
    setSelectedPath(path);
    setPreviewText("");
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(zipBytes);
      const item = zip.files[path];
      if (!item || item.dir) {
        setError(labels.noPreview || "No preview available");
        return;
      }
      if (isTextPath(path)) {
        const text = await item.async("string");
        setPreviewText(text.slice(0, 50_000));
      } else if (isImagePath(path)) {
        const blob = await item.async("blob");
        setPreviewUrl(URL.createObjectURL(blob));
      } else {
        setError(labels.noPreview || "Binary file preview not supported");
      }
    } catch {
      setError(labels.error || "Preview error");
    } finally {
      setBusy(false);
    }
  }

  async function downloadEntry(path: string) {
    if (!zipBytes) return;
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(zipBytes);
      const item = zip.files[path];
      if (!item || item.dir) return;
      const blob = await item.async("blob");
      downloadBlob(blob, path.split("/").pop() || path);
    } catch {
      setError(labels.error || "Download error");
    }
  }

  async function extractSelected(extractAll = false) {
    if (!zipBytes) return;
    setBusy(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(zipBytes);
      const pathsToExtract = extractAll
        ? entries.filter((e) => !e.dir).map((e) => e.path)
        : Array.from(checkedPaths);

      if (!pathsToExtract.length) return;

      if (pathsToExtract.length === 1) {
        await downloadEntry(pathsToExtract[0]);
      } else {
        // Bundle extracted files into a new clean zip
        const outZip = new JSZip();
        for (const p of pathsToExtract) {
          const item = zip.files[p];
          if (item && !item.dir) {
            const content = await item.async("arraybuffer");
            outZip.file(p, content);
          }
        }
        const blob = await outZip.generateAsync({ type: "blob" });
        downloadBlob(blob, `extracted-${zipFileName}`);
      }
    } catch {
      setError(labels.error || "Extraction failed");
    } finally {
      setBusy(false);
    }
  }

  async function appendFiles(files: FileList | File[]) {
    if (!zipBytes && entries.length === 0) {
      // Create new zip from scratch
      const JSZip = (await import("jszip")).default;
      const newZip = new JSZip();
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        newZip.file(f.name, await f.arrayBuffer());
      }
      const buf = await newZip.generateAsync({ type: "arraybuffer" });
      const nextEntries: EntryMeta[] = Array.from(files).map((f) => ({
        path: f.name,
        dir: false,
        compressedSize: f.size,
        uncompressedSize: f.size,
      }));
      setZipBytes(buf);
      setEntries(nextEntries);
      setZipFileName("new-archive.zip");
      return;
    }

    if (!zipBytes) return;
    setBusy(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(zipBytes);
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        zip.file(f.name, await f.arrayBuffer());
      }
      const updatedBuf = await zip.generateAsync({ type: "arraybuffer" });
      setZipBytes(updatedBuf);

      // Refresh entries
      const next: EntryMeta[] = [];
      for (const path of Object.keys(zip.files).sort()) {
        const item = zip.files[path]!;
        const raw = item as unknown as {
          _data?: { uncompressedSize?: number; compressedSize?: number };
        };
        next.push({
          path,
          dir: item.dir,
          compressedSize: raw._data?.compressedSize ?? 0,
          uncompressedSize: raw._data?.uncompressedSize ?? 0,
        });
      }
      setEntries(next);
    } catch {
      setError("Failed to add files to archive");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCheckedFiles() {
    if (!zipBytes || checkedPaths.size === 0) return;
    setBusy(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(zipBytes);
      checkedPaths.forEach((p) => {
        zip.remove(p);
      });
      const updatedBuf = await zip.generateAsync({ type: "arraybuffer" });
      setZipBytes(updatedBuf);
      setCheckedPaths(new Set());

      // Refresh entries
      const next: EntryMeta[] = [];
      for (const path of Object.keys(zip.files).sort()) {
        const item = zip.files[path]!;
        const raw = item as unknown as {
          _data?: { uncompressedSize?: number; compressedSize?: number };
        };
        next.push({
          path,
          dir: item.dir,
          compressedSize: raw._data?.compressedSize ?? 0,
          uncompressedSize: raw._data?.uncompressedSize ?? 0,
        });
      }
      setEntries(next);
    } catch {
      setError("Failed to remove files from archive");
    } finally {
      setBusy(false);
    }
  }

  async function downloadCurrentZip() {
    if (!zipBytes) return;
    downloadBlob(new Blob([zipBytes], { type: "application/zip" }), zipFileName);
  }

  const fileEntries = entries.filter((e) => !e.dir);

  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return entries;
    const q = searchTerm.toLowerCase();
    return entries.filter((e) => e.path.toLowerCase().includes(q));
  }, [entries, searchTerm]);

  function toggleCheck(path: string) {
    setCheckedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function toggleAll() {
    if (checkedPaths.size === fileEntries.length) {
      setCheckedPaths(new Set());
    } else {
      setCheckedPaths(new Set(fileEntries.map((e) => e.path)));
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Top Banner & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {labels.title || "Archive Studio (View, Extract & Manage ZIP)"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {zipBytes
              ? `${zipFileName} • ${fileEntries.length} files • ${formatBytes(zipBytes.byteLength)}`
              : (labels.limitHint || "Inspect, extract selective files, or add new items to ZIP archives.")}
          </p>
        </div>

        {zipBytes && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => appendInputRef.current?.click()}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-sm"
            >
              ➕ Add Files
            </button>
            <button
              type="button"
              onClick={() => extractSelected(true)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              📦 Extract All
            </button>
            <button
              type="button"
              onClick={downloadCurrentZip}
              className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              ⬇ Download ZIP
            </button>
          </div>
        )}
      </div>

      <input
        type="file"
        multiple
        ref={appendInputRef}
        onChange={(e) => {
          if (e.target.files) void appendFiles(e.target.files);
        }}
        className="hidden"
      />

      {!zipBytes ? (
        <FileDropZone
          accept=".zip,application/zip,application/x-zip-compressed"
          dropHint={labels.dropHint || "Drop a ZIP file here, or click to browse"}
          selectHint={labels.selectHint ?? "Inspect contents, extract files, or edit archive"}
          onFiles={(files) => void loadZip(files[0]!)}
          disabled={busy}
        />
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </p>
      ) : null}

      {entries.length > 0 && (
        <div className="space-y-3">
          {/* Action Bar for Items */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedPaths.size > 0 && checkedPaths.size === fileEntries.length}
                  onChange={toggleAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Select All ({checkedPaths.size}/{fileEntries.length})
              </label>

              {checkedPaths.size > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => extractSelected(false)}
                    className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    ⬇ Extract ({checkedPaths.size})
                  </button>
                  <button
                    type="button"
                    onClick={deleteCheckedFiles}
                    className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                  >
                    🗑️ Delete ({checkedPaths.size})
                  </button>
                </>
              )}
            </div>

            {/* Filter */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search file name..."
              className="rounded-lg border border-slate-300 py-1 px-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Entries List */}
          <ul className="max-h-80 space-y-1 overflow-auto text-xs divide-y divide-slate-100 border border-slate-200 rounded-xl p-1 bg-white">
            {filteredEntries.map((entry) => (
              <li
                key={entry.path}
                className={`flex flex-wrap items-center gap-2 rounded-lg px-2.5 py-1.5 transition ${
                  selectedPath === entry.path ? "bg-indigo-50/70" : "hover:bg-slate-50"
                }`}
              >
                {!entry.dir && (
                  <input
                    type="checkbox"
                    checked={checkedPaths.has(entry.path)}
                    onChange={() => toggleCheck(entry.path)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                )}
                <span className="text-slate-400">{entry.dir ? "📁" : "📄"}</span>
                <button
                  type="button"
                  disabled={entry.dir || busy}
                  onClick={() => void preview(entry.path)}
                  className="min-w-0 flex-1 truncate text-left font-mono font-medium text-slate-800 hover:text-indigo-600 disabled:cursor-default"
                >
                  {entry.path}
                </button>
                {!entry.dir ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatBytes(entry.uncompressedSize)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void downloadEntry(entry.path)}
                      className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition"
                      title={labels.download}
                    >
                      ⬇
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Section */}
      {previewUrl ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-bold text-slate-700">{labels.preview || "Image Preview"}</p>
          <img src={previewUrl} alt="Preview" className="max-h-64 rounded-lg border border-slate-200 object-contain mx-auto" />
        </div>
      ) : null}

      {previewText ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-bold text-slate-700">{labels.preview || "Text Preview"}</p>
          <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-3 font-mono text-[11px] text-slate-800 whitespace-pre-wrap">
            {previewText}
          </pre>
        </div>
      ) : null}

      {zipBytes && (
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={() => {
              setEntries([]);
              setZipBytes(null);
              setSelectedPath(null);
              setCheckedPaths(new Set());
              setPreviewText("");
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
              setError("");
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            {labels.clear || "Close Archive"}
          </button>
        </div>
      )}
    </div>
  );
}
