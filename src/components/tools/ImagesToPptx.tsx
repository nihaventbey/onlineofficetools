"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { isImageFile, MAX_IMAGE_BYTES } from "@/lib/files/utils";
import { FileDropZone, PdfFileList } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["imagesToPptx"] };

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const b64 = btoa(binary);
  const mime = file.type || "image/png";
  return `data:${mime};base64,${b64}`;
}

export default function ImagesToPptx({ labels }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function addFiles(incoming: File[]) {
    setError("");
    const next = [...files];
    for (const file of incoming) {
      if (!isImageFile(file)) {
        setError(labels.invalidFile);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError(labels.tooLarge);
        continue;
      }
      next.push(file);
    }
    setFiles(next);
  }

  async function run() {
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      for (const file of files) {
        const slide = pptx.addSlide();
        slide.addImage({
          data: await fileToBase64(file),
          x: 0,
          y: 0,
          w: "100%",
          h: "100%",
        });
      }
      await pptx.writeFile({ fileName: "images.pptx" });
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
        accept="image/*"
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
        <button type="button" onClick={() => { setFiles([]); setError(""); }} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
