"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";
import { rotatePdf } from "@/lib/pdf/operations";
import { downloadBlob, isPdfFile, parsePageRange, readFileBytes } from "@/lib/pdf/utils";
import {
  FileDropZone,
  PdfFileList,
  ProgressBar,
  validatePdfSize,
} from "@/components/tools/pdf/PdfUi";
import { PDFDocument } from "pdf-lib";

type Props = { labels: Dictionary["tools"]["pdfRotate"] };
type Draft = { angle: 90 | 180 | 270; range: string; allPages: boolean };

export default function PdfRotate({ labels }: Props) {
  const [draft, setDraft] = useToolDraft<Draft>("pdf-rotate", {
    angle: 90,
    range: "1",
    allPages: true,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function addFiles(incoming: File[]) {
    setError("");
    const file = incoming[0];
    if (!file || !isPdfFile(file)) {
      setError(labels.invalidFile);
      return;
    }
    if (validatePdfSize(file) !== "ok") {
      setError(labels.tooLarge);
      return;
    }
    try {
      const bytes = await readFileBytes(file);
      const doc = await PDFDocument.load(bytes);
      setPageCount(doc.getPageCount());
      setFiles([file]);
    } catch {
      setError(labels.error);
    }
  }

  async function run() {
    if (!files[0]) return;
    const pages = draft.allPages
      ? ("all" as const)
      : parsePageRange(draft.range, pageCount);
    if (pages !== "all" && !pages.length) {
      setError(labels.invalidRange);
      return;
    }
    setBusy(true);
    setProgress(30);
    setError("");
    try {
      const bytes = await rotatePdf(files[0], draft.angle, pages);
      setProgress(100);
      downloadBlob(bytes, "rotated.pdf");
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
        dropHint={labels.dropHint}
        selectHint={labels.selectHint}
        onFiles={(f) => void addFiles(f)}
        disabled={busy}
      />
      <PdfFileList
        files={files}
        onRemove={() => {
          setFiles([]);
          setPageCount(0);
        }}
        removeLabel={labels.remove}
      />
      <div className="flex flex-wrap gap-2">
        {([90, 180, 270] as const).map((angle) => (
          <button
            key={angle}
            type="button"
            onClick={() => setDraft({ ...draft, angle })}
            className={`min-h-11 rounded-xl px-4 text-sm font-medium ${
              draft.angle === angle
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-slate-50"
            }`}
          >
            {angle}°
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.allPages}
          onChange={(e) => setDraft({ ...draft, allPages: e.target.checked })}
        />
        {labels.allPages}
      </label>
      {!draft.allPages && pageCount > 0 ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{labels.rangeLabel}</span>
          <input
            value={draft.range}
            onChange={(e) => setDraft({ ...draft, range: e.target.value })}
            placeholder={labels.rangePlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-400"
          />
        </label>
      ) : null}
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
            setPageCount(0);
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
