"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["findReplace"] };
type Draft = { text: string; find: string; replace: string };

export default function FindReplace({ labels }: Props) {
  const [draft, setDraft, clear] = useToolDraft<Draft>("find-replace", {
    text: "",
    find: "",
    replace: "",
  });
  const [copied, setCopied] = useState(false);

  function applyReplace() {
    if (!draft.find) return;
    const escaped = draft.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    setDraft({
      ...draft,
      text: draft.text.replace(new RegExp(escaped, "g"), draft.replace),
    });
  }

  function trimLines() {
    setDraft({
      ...draft,
      text: draft.text
        .split(/\r\n|\r|\n/)
        .map((line) => line.trim())
        .join("\n"),
    });
  }

  function dedupeLines() {
    const seen = new Set<string>();
    const lines = draft.text.split(/\r\n|\r|\n/);
    const out: string[] = [];
    for (const line of lines) {
      if (seen.has(line)) continue;
      seen.add(line);
      out.push(line);
    }
    setDraft({ ...draft, text: out.join("\n") });
  }

  function sortLines() {
    setDraft({
      ...draft,
      text: draft.text
        .split(/\r\n|\r|\n/)
        .slice()
        .sort((a, b) => a.localeCompare(b))
        .join("\n"),
    });
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
      <textarea
        value={draft.text}
        onChange={(e) => setDraft({ ...draft, text: e.target.value })}
        placeholder={labels.placeholder}
        rows={12}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={draft.find}
          onChange={(e) => setDraft({ ...draft, find: e.target.value })}
          placeholder={labels.find}
          className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400"
        />
        <input
          value={draft.replace}
          onChange={(e) => setDraft({ ...draft, replace: e.target.value })}
          placeholder={labels.replace}
          className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={applyReplace}
          disabled={!draft.find}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {labels.apply}
        </button>
        <button type="button" onClick={trimLines} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.trim}
        </button>
        <button type="button" onClick={dedupeLines} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.dedupe}
        </button>
        <button type="button" onClick={sortLines} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.sort}
        </button>
        <button type="button" onClick={handleCopy} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {copied ? labels.copied : labels.copy}
        </button>
        <button type="button" onClick={clear} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
