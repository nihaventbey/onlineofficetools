"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["uuidGenerator"] };
type Draft = { count: number; output: string };

export default function UuidGenerator({ labels }: Props) {
  const [draft, setDraft, clear] = useToolDraft<Draft>("uuid-generator", {
    count: 5,
    output: "",
  });
  const [copied, setCopied] = useState(false);

  function generate() {
    const n = Math.min(100, Math.max(1, draft.count));
    const lines = Array.from({ length: n }, () => crypto.randomUUID());
    setDraft({ ...draft, count: n, output: lines.join("\n") });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(draft.output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{labels.count}</span>
        <input
          type="number"
          min={1}
          max={100}
          value={draft.count}
          onChange={(e) => setDraft({ ...draft, count: Number(e.target.value) })}
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-400"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={generate} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500">
          {labels.generate}
        </button>
        <button type="button" onClick={handleCopy} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {copied ? labels.copied : labels.copy}
        </button>
        <button type="button" onClick={clear} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
      <textarea
        readOnly
        value={draft.output}
        rows={10}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm"
      />
    </div>
  );
}
