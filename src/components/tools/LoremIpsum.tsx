"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Draft = { paragraphs: number; words: number; output: string };
type Props = { labels: Dictionary["tools"]["loremIpsum"] };

const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea",
  "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit",
];

function makeParagraph(wordCount: number): string {
  const parts: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    parts.push(WORDS[i % WORDS.length]);
  }
  const text = parts.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

export default function LoremIpsum({ labels }: Props) {
  const [draft, setDraft, clear] = useToolDraft<Draft>("lorem-ipsum", {
    paragraphs: 3,
    words: 40,
    output: "",
  });
  const [copied, setCopied] = useState(false);

  function generate() {
    const paras = Math.min(20, Math.max(1, draft.paragraphs));
    const words = Math.min(200, Math.max(5, draft.words));
    const output = Array.from({ length: paras }, () => makeParagraph(words)).join("\n\n");
    setDraft({ ...draft, paragraphs: paras, words, output });
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
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.paragraphs}</span>
          <input
            type="number"
            min={1}
            max={20}
            value={draft.paragraphs}
            onChange={(e) => setDraft({ ...draft, paragraphs: Number(e.target.value) })}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.words}</span>
          <input
            type="number"
            min={5}
            max={200}
            value={draft.words}
            onChange={(e) => setDraft({ ...draft, words: Number(e.target.value) })}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={generate} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
          {labels.generate}
        </button>
        <button type="button" onClick={handleCopy} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700">
          {copied ? labels.copied : labels.copy}
        </button>
        <button type="button" onClick={clear} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700">
          {labels.clear}
        </button>
      </div>
      <textarea
        readOnly
        value={draft.output}
        rows={12}
        className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed dark:border-zinc-700 dark:bg-zinc-950"
      />
    </div>
  );
}
