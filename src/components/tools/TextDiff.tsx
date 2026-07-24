"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob } from "@/lib/files/utils";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Draft = { left: string; right: string };
type Props = { labels: Dictionary["tools"]["textDiff"] };

type DiffLine = { type: "same" | "add" | "del"; text: string };

type SideRow = {
  left: string;
  right: string;
  kind: "same" | "del" | "add" | "change";
};

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
      out.push({ type: "same", text: left[i]! });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      out.push({ type: "del", text: left[i]! });
      i++;
    } else {
      out.push({ type: "add", text: right[j]! });
      j++;
    }
  }
  while (i < m) out.push({ type: "del", text: left[i++]! });
  while (j < n) out.push({ type: "add", text: right[j++]! });
  return out;
}

/** Pair sequential +/- lines into two-column rows. */
export function toSideBySide(lines: DiffLine[]): SideRow[] {
  const rows: SideRow[] = [];
  for (const line of lines) {
    if (line.type === "same") {
      rows.push({ left: line.text, right: line.text, kind: "same" });
      continue;
    }
    if (line.type === "del") {
      rows.push({ left: line.text, right: "", kind: "del" });
      continue;
    }
    const prev = rows[rows.length - 1];
    if (prev && prev.kind === "del" && prev.right === "") {
      prev.right = line.text;
      prev.kind = "change";
    } else {
      rows.push({ left: "", right: line.text, kind: "add" });
    }
  }
  return rows;
}

function cellShading(kind: SideRow["kind"], side: "left" | "right"): string | undefined {
  if (kind === "same") return undefined;
  if (kind === "change") return side === "left" ? "FECACA" : "BBF7D0";
  if (kind === "del" && side === "left") return "FECACA";
  if (kind === "add" && side === "right") return "BBF7D0";
  return "F8FAFC";
}

export default function TextDiff({ labels }: Props) {
  const [draft, setDraft, clear] = useToolDraft<Draft>("text-diff", {
    left: "",
    right: "",
  });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const lines = useMemo(
    () => (show ? diffLines(draft.left, draft.right) : []),
    [draft.left, draft.right, show],
  );
  const hasDiff = lines.some((l) => l.type !== "same");

  async function downloadDocx() {
    const diff = show ? lines : diffLines(draft.left, draft.right);
    if (!draft.left.trim() && !draft.right.trim()) {
      setError(labels.empty);
      return;
    }
    setBusy(true);
    setError("");
    setShow(true);
    try {
      const docx = await import("docx");
      const rows = toSideBySide(diff);
      const headerRow = new docx.TableRow({
        children: [
          new docx.TableCell({
            width: { size: 4500, type: docx.WidthType.DXA },
            shading: { type: docx.ShadingType.CLEAR, fill: "E2E8F0" },
            children: [
              new docx.Paragraph({
                children: [
                  new docx.TextRun({ text: labels.colOriginal, bold: true }),
                ],
              }),
            ],
          }),
          new docx.TableCell({
            width: { size: 4500, type: docx.WidthType.DXA },
            shading: { type: docx.ShadingType.CLEAR, fill: "E2E8F0" },
            children: [
              new docx.Paragraph({
                children: [
                  new docx.TextRun({ text: labels.colChanged, bold: true }),
                ],
              }),
            ],
          }),
        ],
      });

      const bodyRows = (rows.length ? rows : [{ left: "", right: "", kind: "same" as const }]).map(
        (row) =>
          new docx.TableRow({
            children: (["left", "right"] as const).map((side) => {
              const fill = cellShading(row.kind, side);
              const text = side === "left" ? row.left : row.right;
              return new docx.TableCell({
                width: { size: 4500, type: docx.WidthType.DXA },
                shading: fill
                  ? { type: docx.ShadingType.CLEAR, fill }
                  : undefined,
                children: [
                  new docx.Paragraph({
                    children: [
                      new docx.TextRun({
                        text: text || " ",
                        font: "Courier New",
                        size: 18,
                      }),
                    ],
                  }),
                ],
              });
            }),
          }),
      );

      const document = new docx.Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            children: [
              new docx.Paragraph({
                spacing: { after: 200 },
                children: [
                  new docx.TextRun({
                    text: labels.title,
                    bold: true,
                    size: 28,
                  }),
                ],
              }),
              new docx.Paragraph({
                spacing: { after: 200 },
                children: [
                  new docx.TextRun({
                    text: hasDiff || diff.some((l) => l.type !== "same")
                      ? labels.differences
                      : labels.identical,
                    italics: true,
                    size: 20,
                  }),
                ],
              }),
              new docx.Table({
                width: { size: 9000, type: docx.WidthType.DXA },
                columnWidths: [4500, 4500],
                rows: [headerRow, ...bodyRows],
              }),
            ],
          },
        ],
      });
      const blob = await docx.Packer.toBlob(document);
      downloadBlob(blob, "text-diff.docx");
    } catch {
      setError(labels.docxError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          value={draft.left}
          onChange={(e) => {
            setDraft({ ...draft, left: e.target.value });
            setShow(false);
            setError("");
          }}
          placeholder={labels.leftPlaceholder}
          rows={10}
          className="w-full resize-y rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900"
        />
        <textarea
          value={draft.right}
          onChange={(e) => {
            setDraft({ ...draft, right: e.target.value });
            setShow(false);
            setError("");
          }}
          placeholder={labels.rightPlaceholder}
          rows={10}
          className="w-full resize-y rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShow(true)}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          {labels.compare}
        </button>
        <button
          type="button"
          onClick={() => void downloadDocx()}
          disabled={busy}
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:opacity-40"
        >
          {busy ? labels.docxProcessing : labels.downloadDocx}
        </button>
        <button
          type="button"
          onClick={() => {
            clear();
            setShow(false);
            setError("");
          }}
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700"
        >
          {labels.clear}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {show ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 text-sm font-medium">
            {hasDiff ? labels.differences : labels.identical}
          </p>
          <pre className="max-h-96 overflow-auto rounded-xl bg-zinc-50 p-3 font-mono text-xs dark:bg-zinc-950">
            {lines.map((line, idx) => (
              <div
                key={`${idx}-${line.type}`}
                className={
                  line.type === "add"
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                    : line.type === "del"
                      ? "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
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
