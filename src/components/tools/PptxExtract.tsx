"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadText, formatBytes, MAX_DOC_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["pptxExtract"] };

function isPptx(file: File): boolean {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    file.name.toLowerCase().endsWith(".pptx")
  );
}

function extractSlideTexts(xml: string): string[] {
  const texts: string[] = [];
  const re = /<a:t[^>]*>([^<]*)<\/a:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const t = m[1]?.trim();
    if (t) texts.push(t);
  }
  return texts;
}

export default function PptxExtract({ labels }: Props) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function extract(file: File) {
    if (!isPptx(file)) {
      setError(labels.invalidFile);
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const slidePaths = Object.keys(zip.files)
        .filter((p) => /ppt\/slides\/slide\d+\.xml$/i.test(p))
        .sort((a, b) => {
          const na = Number(/slide(\d+)/i.exec(a)?.[1] ?? 0);
          const nb = Number(/slide(\d+)/i.exec(b)?.[1] ?? 0);
          return na - nb;
        });
      const parts: string[] = [];
      for (const path of slidePaths) {
        const xml = await zip.files[path]!.async("text");
        const lines = extractSlideTexts(xml);
        parts.push(lines.join("\n"));
      }
      setText(parts.join("\n\n").trim());
      setFileName(`${file.name} · ${formatBytes(file.size)}`);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <FileDropZone
        accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        dropHint={labels.dropHint}
        selectHint={labels.selectHint ?? ""}
        onFiles={(files) => void extract(files[0])}
        disabled={busy}
      />
      {fileName ? <p className="text-sm text-slate-600">{fileName}</p> : null}
      {busy ? <p className="text-sm text-slate-500">{labels.processing}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <textarea
        value={text}
        readOnly
        rows={14}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadText(text, "slides.txt")}
          disabled={!text}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {labels.download}
        </button>
        <button type="button" onClick={handleCopy} disabled={!text} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium disabled:opacity-40">
          {copied ? labels.copied : labels.copy}
        </button>
        <button
          type="button"
          onClick={() => {
            setText("");
            setFileName("");
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
