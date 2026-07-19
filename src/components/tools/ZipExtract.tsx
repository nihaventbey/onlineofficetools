"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob, formatBytes, MAX_ZIP_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["zipExtract"] };

type Entry = {
  path: string;
  size: number;
  blob: Blob;
};

function isZipFile(file: File): boolean {
  return (
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed" ||
    /\.zip$/i.test(file.name)
  );
}

export default function ZipExtract({ labels }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);

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
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const next: Entry[] = [];
      const paths = Object.keys(zip.files).sort();
      for (const path of paths) {
        const item = zip.files[path]!;
        if (item.dir) continue;
        const blob = await item.async("blob");
        next.push({ path, size: blob.size, blob });
      }
      if (!next.length) {
        setError(labels.emptyZip);
        return;
      }
      setEntries(next);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function downloadAll() {
    if (!entries.length) return;
    setBusy(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const entry of entries) {
        zip.file(entry.path, entry.blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      downloadBlob(out, "extracted.zip");
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
        accept=".zip,application/zip,application/x-zip-compressed"
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={(files) => void loadZip(files[0]!)}
        disabled={busy}
      />
      {entries.length ? (
        <p className="text-sm text-slate-600">
          {labels.fileCount.replace("{count}", String(entries.length))}
        </p>
      ) : null}
      {entries.length ? (
        <ul className="max-h-80 space-y-2 overflow-auto">
          {entries.map((entry) => (
            <li
              key={entry.path}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                {entry.path}
              </span>
              <span className="text-xs text-slate-500">{formatBytes(entry.size)}</span>
              <button
                type="button"
                onClick={() =>
                  downloadBlob(entry.blob, entry.path.split("/").pop() || entry.path)
                }
                className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium"
              >
                {labels.download}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void downloadAll()}
          disabled={busy || !entries.length}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {busy ? labels.processing : labels.downloadAll}
        </button>
        <button
          type="button"
          onClick={() => {
            setEntries([]);
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
