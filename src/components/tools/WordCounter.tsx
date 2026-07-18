"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type WordCounterProps = {
  labels: Dictionary["tools"]["wordCounter"];
};

function toTitleCase(text: string): string {
  return text.replace(
    /\w\S*/g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );
}

function toSentenceCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, (match) => match.toUpperCase());
}

export default function WordCounter({ labels }: WordCounterProps) {
  const [text, setText, clear] = useToolDraft("word-counter", "");
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
    const sentences = trimmed
      ? trimmed.split(/[.!?]+/).filter((part) => part.trim().length > 0).length
      : 0;
    return { words, characters, charactersNoSpaces, lines, sentences };
  }, [text]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const statCards = [
    { label: labels.words, value: stats.words },
    { label: labels.characters, value: stats.characters },
    { label: labels.charactersNoSpaces, value: stats.charactersNoSpaces },
    { label: labels.lines, value: stats.lines },
    { label: labels.sentences, value: stats.sentences },
  ];

  const converters = [
    { label: labels.uppercase, apply: (v: string) => v.toUpperCase() },
    { label: labels.lowercase, apply: (v: string) => v.toLowerCase() },
    { label: labels.titleCase, apply: toTitleCase },
    { label: labels.sentenceCase, apply: toSentenceCase },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={labels.placeholder}
          rows={12}
          className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base leading-relaxed text-zinc-900 outline-none ring-violet-500/40 transition focus:border-violet-400 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            {copied ? labels.copied : labels.copy}
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {labels.clear}
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {labels.statsHeading}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-4 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950"
            >
              <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
                {card.value}
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {card.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {labels.convertHeading}
        </h2>
        <div className="flex flex-wrap gap-2">
          {converters.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setText(item.apply(text))}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-violet-500/50 dark:hover:bg-violet-950/40 dark:hover:text-violet-200"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
