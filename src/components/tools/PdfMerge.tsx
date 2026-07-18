"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { mergePdfs } from "@/lib/pdf/operations";
import { downloadBlob, isPdfFile } from "@/lib/pdf/utils";
import {
  FileDropZone,
  PdfFileList,
  ProgressBar,
  validatePdfSize,
} from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["pdfMerge"] };

export default function PdfMerge({ labels }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  function addFiles(incoming: File[]) {
    setError("");
    let total = files.reduce((s, f) => s + f.size, 0);
    const next = [...files];
    for (const file of incoming) {
      if (!isPdfFile(file)) {
        setError(labels.invalidFile);
        continue;
      }
      const check = validatePdfSize(file, total);
      if (check === "too_large") {
        setError(labels.tooLarge);
        continue;
      }
      if (check === "merge_too_large") {
        setError(labels.mergeTooLarge);
        break;
      }
      next.push(file);
      total += file.size;
    }
    setFiles(next);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= files.length) return;
    const next = [...files];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setFiles(next);
  }

  async function run() {
    if (files.length < 2) {
      setError(labels.needTwo);
      return;
    }
    setBusy(true);
    setProgress(10);
    setError("");
    try {
      const bytes = await mergePdfs(files);
      setProgress(100);
      downloadBlob(bytes, "merged.pdf");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(msg === "ENCRYPTED" ? labels.encrypted : labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <FileDropZone
        accept="application/pdf,.pdf"
        multiple
        dropHint={labels.dropHint}
        selectHint={labels.selectHint}
        onFiles={addFiles}
        disabled={busy}
      />
      <PdfFileList
        files={files}
        onRemove={(i) => setFiles(files.filter((_, idx) => idx !== i))}
        onMove={move}
        removeLabel={labels.remove}
      />
      {busy ? <ProgressBar value={progress} label={labels.processing} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || files.length < 2}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {labels.download}
        </button>
        <button
          type="button"
          onClick={() => {
            setFiles([]);
            setError("");
            setProgress(0);
          }}
          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
        >
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
