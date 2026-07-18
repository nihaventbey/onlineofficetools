"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { formatBytes, MAX_DOC_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["docxDiff"] };

type DiffLine = { type: "same" | "add" | "del"; text: string };

function isDocx(file: File): boolean {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

function diffLines(a: string, b: string): DiffLine[] {
  const left = a.split(/\r\n|\r|\n/);
  const right = b.split(/\r\n|\r|\n/);
  const m = left.length;
  const n = right.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] =
        left[i] === right[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (left[i] === right[j]) {
      out.push({ type: "same", text: left[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", text: left[i] });
      i++;
    } else {
      out.push({ type: "add", text: right[j] });
      j++;
    }
  }
  while (i < m) out.push({ type: "del", text: left[i++] });
  while (j < n) out.push({ type: "add", text: right[j++] });
  return out;
}

export default function DocxDiff({ labels }: Props) {
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function extractText(file: File): Promise<string> {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value.trim();
  }

  async function loadSide(side: "left" | "right", file: File) {
    if (!isDocx(file)) {
      setError(labels.invalidFile);
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setError(labels.tooLarge);
      return;
    }
    setBusy(true);
    setError("");
    setShow(false);
    try {
      const text = await extractText(file);
      if (side === "left") {
        setLeftFile(file);
        setLeftText(text);
      } else {
        setRightFile(file);
        setRightText(text);
      }
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  const lines = useMemo(
    () => (show ? diffLines(leftText, rightText) : []),
    [leftText, rightText, show],
  );
  const hasDiff = lines.some((l) => l.type !== "same");

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{labels.left}</p>
          <FileDropZone
            accept=".docx"
            dropHint={labels.dropHint}
            selectHint={labels.selectHint ?? ""}
            onFiles={(files) => void loadSide("left", files[0])}
            disabled={busy}
          />
          {leftFile ? (
            <p className="text-xs text-slate-500">
              {leftFile.name} · {formatBytes(leftFile.size)}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{labels.right}</p>
          <FileDropZone
            accept=".docx"
            dropHint={labels.dropHint}
            selectHint={labels.selectHint ?? ""}
            onFiles={(files) => void loadSide("right", files[0])}
            disabled={busy}
          />
          {rightFile ? (
            <p className="text-xs text-slate-500">
              {rightFile.name} · {formatBytes(rightFile.size)}
            </p>
          ) : null}
        </div>
      </div>
      {busy ? <p className="text-sm text-slate-500">{labels.processing}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShow(true)}
          disabled={!leftText || !rightText}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {labels.compare}
        </button>
        <button
          type="button"
          onClick={() => {
            setLeftFile(null);
            setRightFile(null);
            setLeftText("");
            setRightText("");
            setShow(false);
            setError("");
          }}
          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
        >
          {labels.clear}
        </button>
      </div>
      {show ? (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-medium">{hasDiff ? labels.differences : labels.identical}</p>
          <pre className="max-h-96 overflow-auto rounded-xl bg-white p-3 font-mono text-xs">
            {lines.map((line, idx) => (
              <div
                key={`${idx}-${line.type}`}
                className={
                  line.type === "add"
                    ? "bg-emerald-100 text-emerald-900"
                    : line.type === "del"
                      ? "bg-red-100 text-red-900"
                      : ""
                }
              >
                {line.type === "add" ? "+ " : line.type === "del" ? "- " : "  "}
                {line.text}
              </div>
            ))}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
