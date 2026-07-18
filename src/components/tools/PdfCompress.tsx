"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";
import { compressPdf } from "@/lib/pdf/compress";
import { downloadBlob, formatBytes, isPdfFile } from "@/lib/pdf/utils";
import {
  FileDropZone,
  PdfFileList,
  ProgressBar,
  validatePdfSize,
} from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["pdfCompress"] };
type Draft = { quality: number };

export default function PdfCompress({ labels }: Props) {
  const [draft, setDraft] = useToolDraft<Draft>("pdf-compress", {
    quality: 0.7,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [resultInfo, setResultInfo] = useState("");

  function addFiles(incoming: File[]) {
    setError("");
    setResultInfo("");
    const file = incoming[0];
    if (!file || !isPdfFile(file)) {
      setError(labels.invalidFile);
      return;
    }
    if (validatePdfSize(file) !== "ok") {
      setError(labels.tooLarge);
      return;
    }
    setFiles([file]);
  }

  async function run() {
    if (!files[0]) return;
    setBusy(true);
    setProgress(0);
    setError("");
    setResultInfo("");
    try {
      const before = files[0].size;
      const bytes = await compressPdf(files[0], draft.quality, setProgress);
      setProgress(100);
      setResultInfo(
        `${labels.resultSize}: ${formatBytes(before)} → ${formatBytes(bytes.byteLength)}`,
      );
      downloadBlob(bytes, "compressed.pdf");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(msg === "ENCRYPTED" ? labels.encrypted : labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.rasterNote}</p>
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <FileDropZone
        accept="application/pdf,.pdf"
        dropHint={labels.dropHint}
        selectHint={labels.selectHint}
        onFiles={addFiles}
        disabled={busy}
      />
      <PdfFileList
        files={files}
        onRemove={() => setFiles([])}
        removeLabel={labels.remove}
      />
      <label className="block text-sm">
        <span className="mb-1 block font-medium">
          {labels.quality}: {Math.round(draft.quality * 100)}%
        </span>
        <input
          type="range"
          min={40}
          max={90}
          value={Math.round(draft.quality * 100)}
          onChange={(e) =>
            setDraft({ quality: Number(e.target.value) / 100 })
          }
          className="w-full"
        />
      </label>
      {busy ? <ProgressBar value={progress} label={labels.processing} /> : null}
      {resultInfo ? <p className="text-sm text-emerald-700">{resultInfo}</p> : null}
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
            setResultInfo("");
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
