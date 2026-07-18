"use client";

import { useCallback, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["ocr"] };
type Draft = { text: string; lang: "eng" | "tur" };

export default function OcrTool({ labels }: Props) {
  const [draft, setDraft, clear] = useToolDraft<Draft>("ocr", {
    text: "",
    lang: "eng",
  });
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runOcr = useCallback(
    async (file: File) => {
      setError("");
      setBusy(true);
      setProgress(0);
      const url = URL.createObjectURL(file);
      setPreview(url);
      try {
        const Tesseract = await import("tesseract.js");
        const result = await Tesseract.recognize(file, draft.lang, {
          logger: (m) => {
            if (m.status === "recognizing text" && typeof m.progress === "number") {
              setProgress(Math.round(m.progress * 100));
            }
          },
        });
        setDraft({ ...draft, text: result.data.text.trim() });
        setProgress(100);
      } catch {
        setError(labels.error);
      } finally {
        setBusy(false);
      }
    },
    [draft, labels.error, setDraft],
  );

  function onFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) {
      setError(labels.error);
      return;
    }
    void runOcr(file);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(draft.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap gap-2">
        {(["eng", "tur"] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setDraft({ ...draft, lang })}
            className={`min-h-11 rounded-xl px-4 text-sm font-medium ${
              draft.lang === lang
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            {lang === "eng" ? labels.langEn : labels.langTr}
          </button>
        ))}
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files?.[0]);
        }}
        className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
        onClick={() => inputRef.current?.click()}
      >
        <p className="text-sm font-medium text-slate-700">{labels.dropHint}</p>
        <p className="mt-1 text-xs text-slate-500">{labels.selectImage}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="max-h-48 rounded-xl border border-slate-200 object-contain" />
      ) : null}

      {busy ? (
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>{labels.processing}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <textarea
        value={draft.text}
        onChange={(e) => setDraft({ ...draft, text: e.target.value })}
        placeholder={labels.placeholder}
        rows={10}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleCopy} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500">
          {copied ? labels.copied : labels.copy}
        </button>
        <button
          type="button"
          onClick={() => {
            clear();
            setPreview(null);
            setProgress(0);
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
