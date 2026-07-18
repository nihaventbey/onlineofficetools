"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";
import { imagesToPdf } from "@/lib/pdf/operations";
import { downloadBlob, isImageFile } from "@/lib/pdf/utils";
import {
  FileDropZone,
  PdfFileList,
  ProgressBar,
  validatePdfSize,
} from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["imagesToPdf"] };
type Draft = { pageSize: "auto" | "a4" };

export default function ImagesToPdf({ labels }: Props) {
  const [draft, setDraft] = useToolDraft<Draft>("images-to-pdf", {
    pageSize: "auto",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  function addFiles(incoming: File[]) {
    setError("");
    const next = [...files];
    for (const file of incoming) {
      if (!isImageFile(file)) {
        setError(labels.invalidFile);
        continue;
      }
      if (validatePdfSize(file) !== "ok") {
        setError(labels.tooLarge);
        continue;
      }
      next.push(file);
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
    if (!files.length) return;
    setBusy(true);
    setProgress(20);
    setError("");
    try {
      const bytes = await imagesToPdf(files, draft.pageSize);
      setProgress(100);
      downloadBlob(bytes, "images.pdf");
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
        accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
        multiple
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={addFiles}
        disabled={busy}
      />
      <PdfFileList
        files={files}
        onRemove={(i) => setFiles(files.filter((_, idx) => idx !== i))}
        onMove={move}
        removeLabel={labels.remove}
      />
      <div className="flex flex-wrap gap-2">
        {(["auto", "a4"] as const).map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setDraft({ pageSize: size })}
            className={`min-h-11 rounded-xl px-4 text-sm font-medium ${
              draft.pageSize === size
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-slate-50"
            }`}
          >
            {size === "auto" ? labels.pageAuto : labels.pageA4}
          </button>
        ))}
      </div>
      {busy ? <ProgressBar value={progress} label={labels.processing} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !files.length}
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
