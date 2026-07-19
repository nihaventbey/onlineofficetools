"use client";

import { useEffect, useState } from "react";
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
  const [selected, setSelected] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function loadZip(file: File) {
    if (!isZipFile(file)) {
      setError(labels.invalidFile);
      return;
    }
    if (file.size > MAX_ZIP_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    setBusy(true);
    setError("");
    setEntries([]);
    setSelected(null);
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
        setError(labels.emptyZip);
        return;
      }
      setZipBytes(buf);
      setEntries(next);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function preview(path: string) {
    if (!zipBytes) return;
    setBusy(true);
    setError("");
    setSelected(path);
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
        setError(labels.noPreview);
        return;
      }
      if (isTextPath(path)) {
        const text = await item.async("string");
        setPreviewText(text.slice(0, 50_000));
      } else if (isImagePath(path)) {
        const blob = await item.async("blob");
        setPreviewUrl(URL.createObjectURL(blob));
      } else {
        setError(labels.noPreview);
      }
    } catch {
      setError(labels.error);
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
      setError(labels.error);
    }
  }

  const fileEntries = entries.filter((e) => !e.dir);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <FileDropZone
        accept=".zip,application/zip,application/x-zip-compressed"
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={(files) => void loadZip(files[0]!)}
        disabled={busy}
      />
      {fileEntries.length ? (
        <p className="text-sm text-slate-600">
          {labels.fileCount.replace("{count}", String(fileEntries.length))}
        </p>
      ) : null}
      {entries.length ? (
        <ul className="max-h-80 space-y-1 overflow-auto text-sm">
          {entries.map((entry) => (
            <li
              key={entry.path}
              className={`flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 ${
                selected === entry.path ? "bg-blue-50" : "hover:bg-slate-50"
              }`}
            >
              <button
                type="button"
                disabled={entry.dir || busy}
                onClick={() => void preview(entry.path)}
                className="min-w-0 flex-1 truncate text-left font-medium text-slate-800 disabled:cursor-default disabled:opacity-60"
              >
                {entry.dir ? `${entry.path}` : entry.path}
              </button>
              {!entry.dir ? (
                <>
                  <span className="text-xs text-slate-500" title={labels.compressed}>
                    {formatBytes(entry.compressedSize)}
                  </span>
                  <span className="text-xs text-slate-400" title={labels.uncompressed}>
                    / {formatBytes(entry.uncompressedSize)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void downloadEntry(entry.path)}
                    className="min-h-8 rounded-lg border border-slate-200 px-2 text-xs"
                  >
                    {labels.download}
                  </button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {previewUrl ? (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">{labels.preview}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="max-h-64 rounded-xl border border-slate-200" />
        </div>
      ) : null}
      {previewText ? (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">{labels.preview}</p>
          <pre className="max-h-64 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 whitespace-pre-wrap">
            {previewText}
          </pre>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={() => {
          setEntries([]);
          setZipBytes(null);
          setSelected(null);
          setPreviewText("");
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
          setError("");
        }}
        className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
      >
        {labels.clear}
      </button>
    </div>
  );
}
