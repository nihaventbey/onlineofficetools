"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { formatBytes, MAX_DOC_BYTES } from "@/lib/files/utils";
import {
  compareBlocks,
  estimateComplexity,
  extractDocxBlocks,
  type CompareResult,
  type DocBlock,
  type WordMark,
} from "@/lib/docx/compare";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["docxDiff"] };

function isDocx(file: File): boolean {
  return (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

function WordLine({ marks, side }: { marks: WordMark[]; side: "left" | "right" }) {
  return (
    <span className="whitespace-pre-wrap break-words">
      {marks.map((m, i) => {
        if (m.type === "same") {
          return <span key={i}>{m.text}</span>;
        }
        if (side === "left" && m.type === "del") {
          return (
            <span
              key={i}
              className="rounded-sm bg-red-200/90 text-red-950 line-through decoration-red-700/80"
            >
              {m.text}
            </span>
          );
        }
        if (side === "right" && m.type === "add") {
          return (
            <span
              key={i}
              className="rounded-sm bg-emerald-200/90 text-emerald-950 underline decoration-emerald-700/50"
            >
              {m.text}
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}

export default function DocxDiff({ labels }: Props) {
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [leftBlocks, setLeftBlocks] = useState<DocBlock[]>([]);
  const [rightBlocks, setRightBlocks] = useState<DocBlock[]>([]);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [acceptedRisk, setAcceptedRisk] = useState(false);
  const [heavyHint, setHeavyHint] = useState(false);

  const styleLabels = {
    boldOn: labels.styleBoldOn,
    boldOff: labels.styleBoldOff,
    italicOn: labels.styleItalicOn,
    italicOff: labels.styleItalicOff,
    underlineOn: labels.styleUnderlineOn,
    underlineOff: labels.styleUnderlineOff,
  };

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
    setResult(null);
    try {
      const { blocks } = await extractDocxBlocks(file);
      if (side === "left") {
        setLeftFile(file);
        setLeftBlocks(blocks);
        setHeavyHint(
          estimateComplexity(blocks, rightBlocks) > 400 ||
            file.size > 2 * 1024 * 1024 ||
            (rightFile?.size ?? 0) > 2 * 1024 * 1024,
        );
      } else {
        setRightFile(file);
        setRightBlocks(blocks);
        setHeavyHint(
          estimateComplexity(leftBlocks, blocks) > 400 ||
            file.size > 2 * 1024 * 1024 ||
            (leftFile?.size ?? 0) > 2 * 1024 * 1024,
        );
      }
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  function runCompare() {
    if (!acceptedRisk) {
      setError(labels.mustAcceptRisk);
      return;
    }
    if (!leftBlocks.length || !rightBlocks.length) {
      setError(labels.needBoth);
      return;
    }
    setBusy(true);
    setError("");
    // Yield so the UI can show "processing" before heavy sync work
    window.setTimeout(() => {
      try {
        const complexity = estimateComplexity(leftBlocks, rightBlocks);
        setHeavyHint(complexity > 400);
        const compared = compareBlocks(leftBlocks, rightBlocks, styleLabels);
        setResult(compared);
      } catch {
        setError(labels.error);
      } finally {
        setBusy(false);
      }
    }, 30);
  }

  function clearAll() {
    setLeftFile(null);
    setRightFile(null);
    setLeftBlocks([]);
    setRightBlocks([]);
    setResult(null);
    setError("");
    setAcceptedRisk(false);
    setHeavyHint(false);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">{labels.limitHint}</p>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">{labels.riskTitle}</p>
        <p className="mt-1 leading-relaxed">{labels.riskBody}</p>
        {heavyHint ? (
          <p className="mt-2 font-medium text-amber-900">{labels.riskHeavy}</p>
        ) : null}
        <label className="mt-3 flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-1"
            checked={acceptedRisk}
            onChange={(e) => {
              setAcceptedRisk(e.target.checked);
              setError("");
            }}
          />
          <span>{labels.riskAccept}</span>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {labels.left}
          </p>
          <FileDropZone
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            dropHint={labels.dropHint}
            selectHint={labels.selectHint ?? ""}
            onFiles={(files) => void loadSide("left", files[0]!)}
            disabled={busy}
          />
          {leftFile ? (
            <p className="text-xs text-slate-500">
              {leftFile.name} · {formatBytes(leftFile.size)} ·{" "}
              {labels.paragraphs.replace(
                "{count}",
                String(leftBlocks.length),
              )}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {labels.right}
          </p>
          <FileDropZone
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            dropHint={labels.dropHint}
            selectHint={labels.selectHint ?? ""}
            onFiles={(files) => void loadSide("right", files[0]!)}
            disabled={busy}
          />
          {rightFile ? (
            <p className="text-xs text-slate-500">
              {rightFile.name} · {formatBytes(rightFile.size)} ·{" "}
              {labels.paragraphs.replace(
                "{count}",
                String(rightBlocks.length),
              )}
            </p>
          ) : null}
        </div>
      </div>

      {busy ? <p className="text-sm text-slate-500">{labels.processing}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runCompare}
          disabled={
            busy || !leftBlocks.length || !rightBlocks.length || !acceptedRisk
          }
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {labels.compare}
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
        >
          {labels.clear}
        </button>
      </div>

      {result ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {result.summary.identical
                ? labels.identical
                : labels.differences}
            </p>
            <p className="mt-1 text-xs text-slate-500">{labels.scopeNote}</p>
            {!result.summary.identical ? (
              <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                <li className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-700 shadow-sm">
                  {labels.statText.replace(
                    "{count}",
                    String(result.summary.textChanges),
                  )}
                </li>
                <li className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-700 shadow-sm">
                  {labels.statStyle.replace(
                    "{count}",
                    String(result.summary.styleOnlyChanges),
                  )}
                </li>
                <li className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
                  {labels.statAdded.replace(
                    "{count}",
                    String(result.summary.added),
                  )}
                </li>
                <li className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-800">
                  {labels.statRemoved.replace(
                    "{count}",
                    String(result.summary.removed),
                  )}
                </li>
              </ul>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid grid-cols-2 gap-px border-b border-slate-200 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <div className="bg-slate-100 px-3 py-2">{labels.colOriginal}</div>
              <div className="bg-slate-100 px-3 py-2">{labels.colChanged}</div>
            </div>
            <div className="max-h-[32rem] overflow-auto divide-y divide-slate-100 text-sm">
              {result.rows.map((row, idx) => {
                if (row.kind === "same") {
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-2 gap-px bg-white text-slate-600"
                    >
                      <div className="px-3 py-2">{row.left}</div>
                      <div className="px-3 py-2">{row.right}</div>
                    </div>
                  );
                }
                if (row.kind === "style") {
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-2 gap-px bg-amber-50/80"
                    >
                      <div className="px-3 py-2">
                        <p>{row.left}</p>
                        <p className="mt-1 text-xs font-medium text-amber-800">
                          {labels.styleOnlyTag}
                        </p>
                      </div>
                      <div className="px-3 py-2">
                        <p>{row.right}</p>
                        <ul className="mt-1 flex flex-wrap gap-1">
                          {(row.styleChanges ?? []).map((s) => (
                            <li
                              key={s}
                              className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-semibold text-amber-950"
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                }
                if (row.kind === "changed" && row.leftWords && row.rightWords) {
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-2 gap-px bg-sky-50/40"
                    >
                      <div className="bg-red-50/50 px-3 py-2">
                        <WordLine marks={row.leftWords} side="left" />
                      </div>
                      <div className="bg-emerald-50/50 px-3 py-2">
                        <WordLine marks={row.rightWords} side="right" />
                      </div>
                    </div>
                  );
                }
                if (row.kind === "removed") {
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-2 gap-px bg-red-50/40"
                    >
                      <div className="px-3 py-2 text-red-900 line-through">
                        {row.left}
                      </div>
                      <div className="px-3 py-2 text-slate-400">—</div>
                    </div>
                  );
                }
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-2 gap-px bg-emerald-50/40"
                  >
                    <div className="px-3 py-2 text-slate-400">—</div>
                    <div className="px-3 py-2 text-emerald-900 underline decoration-emerald-600/40">
                      {row.right}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
