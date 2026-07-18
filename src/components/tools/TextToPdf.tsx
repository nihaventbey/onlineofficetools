"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";
import { downloadBlob } from "@/lib/files/utils";

type Props = { labels: Dictionary["tools"]["textToPdf"] };

const MARGIN = 50;
const LINE_HEIGHT = 14;
const FONT_SIZE = 11;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

export default function TextToPdf({ labels }: Props) {
  const [text, setText, clear] = useToolDraft("text-to-pdf", "Line one\nLine two\nLine three");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const lines = text.split(/\r\n|\r|\n/);
      let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      let y = PAGE_HEIGHT - MARGIN;

      for (const line of lines) {
        if (y < MARGIN) {
          page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = PAGE_HEIGHT - MARGIN;
        }
        page.drawText(line || " ", {
          x: MARGIN,
          y,
          size: FONT_SIZE,
          font,
          color: rgb(0.05, 0.1, 0.2),
          maxWidth: PAGE_WIDTH - MARGIN * 2,
        });
        y -= LINE_HEIGHT;
      }

      const bytes = await doc.save();
      const copy = new Uint8Array(bytes);
      downloadBlob(new Blob([copy], { type: "application/pdf" }), "document.pdf");
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={labels.placeholder}
        rows={14}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !text.trim()}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {labels.download}
        </button>
        <button type="button" onClick={clear} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
