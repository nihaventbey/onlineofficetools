"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob, formatBytes, MAX_ZIP_BYTES } from "@/lib/files/utils";
import { FileDropZone, PdfFileList } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["zipCreate"] };

export default function ZipCreate({ labels }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("archive.zip");

  function addFiles(incoming: File[]) {
    setError("");
    const next = [...files];
    let total = next.reduce((sum, f) => sum + f.size, 0);
    for (const file of incoming) {
      if (file.size > MAX_ZIP_BYTES || total + file.size > MAX_ZIP_BYTES) {
        setError(labels.tooLarge);
        continue;
      }
      next.push(file);
      total += file.size;
    }
    setFiles(next);
  }

  async function run() {
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const file of files) {
        zip.file(file.name, file);
      }
      const out = await zip.generateAsync({ type: "blob" });
      const name = fileName.trim().endsWith(".zip")
        ? fileName.trim()
        : `${fileName.trim() || "archive"}.zip`;
      downloadBlob(out, name);
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
        accept="*/*"
        multiple
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={addFiles}
        disabled={busy}
      />
      <PdfFileList
        files={files}
        onRemove={(i) => setFiles(files.filter((_, idx) => idx !== i))}
        removeLabel={labels.remove}
      />
      {files.length ? (
        <p className="text-sm text-slate-600">
          {labels.fileCount.replace("{count}", String(files.length))} ·{" "}
          {formatBytes(files.reduce((s, f) => s + f.size, 0))}
        </p>
      ) : null}
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">{labels.fileName}</span>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          disabled={busy}
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !files.length}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {busy ? labels.processing : labels.download}
        </button>
        <button
          type="button"
          onClick={() => {
            setFiles([]);
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
