"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { canvasToBlob, downloadBlob, MAX_DOC_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["pdfToImages"] };

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export default function PdfToImages({ labels }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);

  async function renderPdf(file: File) {
    if (!isPdfFile(file)) {
      setError(labels.invalidFile);
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    setBusy(true);
    setError("");
    setPreviews([]);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      setPageCount(pdf.numPages);
      const urls: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas");
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        urls.push(canvas.toDataURL("image/png"));
      }
      setPreviews(urls);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function downloadOne(index: number) {
    const dataUrl = previews[index];
    if (!dataUrl) return;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    downloadBlob(blob, `page-${index + 1}.png`);
  }

  async function downloadAll() {
    if (!previews.length) return;
    setBusy(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (let i = 0; i < previews.length; i++) {
        const res = await fetch(previews[i]!);
        const blob = await res.blob();
        zip.file(`page-${i + 1}.png`, blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      downloadBlob(out, "pdf-pages.zip");
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
        accept="application/pdf,.pdf"
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={(files) => void renderPdf(files[0])}
        disabled={busy}
      />
      {pageCount ? <p className="text-sm text-slate-600">{pageCount} pages</p> : null}
      {busy ? <p className="text-sm text-slate-500">{labels.processing}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {previews.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {previews.map((url, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Page ${i + 1}`} className="mb-2 max-h-48 w-full object-contain" />
              <button
                type="button"
                onClick={() => void downloadOne(i)}
                className="min-h-9 w-full rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-500"
              >
                {labels.download}
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void downloadAll()}
          disabled={!previews.length || busy}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {labels.downloadAll}
        </button>
        <button
          type="button"
          onClick={() => {
            setPreviews([]);
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
