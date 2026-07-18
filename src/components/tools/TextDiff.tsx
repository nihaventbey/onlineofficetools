"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Draft = { left: string; right: string };
type Props = { labels: Dictionary["tools"]["textDiff"] };

type DiffLine = { type: "same" | "add" | "del"; text: string };

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

export default function TextDiff({ labels }: Props) {
  const [draft, setDraft, clear] = useToolDraft<Draft>("text-diff", {
    left: "",
    right: "",
  });
  const [show, setShow] = useState(false);

  const lines = useMemo(
    () => (show ? diffLines(draft.left, draft.right) : []),
    [draft.left, draft.right, show],
  );
  const hasDiff = lines.some((l) => l.type !== "same");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          value={draft.left}
          onChange={(e) => {
            setDraft({ ...draft, left: e.target.value });
            setShow(false);
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
          onClick={clear}
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700"
        >
          {labels.clear}
        </button>
      </div>
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
