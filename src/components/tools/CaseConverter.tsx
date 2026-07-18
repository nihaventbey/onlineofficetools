"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["caseConverter"] };

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

function toWords(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function toCamelCase(text: string): string {
  const words = toWords(text).map((w) => w.toLowerCase());
  if (!words.length) return "";
  return (
    words[0] +
    words
      .slice(1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("")
  );
}

function toSnakeCase(text: string): string {
  return toWords(text)
    .map((w) => w.toLowerCase())
    .join("_");
}

function toKebabCase(text: string): string {
  return toWords(text)
    .map((w) => w.toLowerCase())
    .join("-");
}

export default function CaseConverter({ labels }: Props) {
  const [text, setText, clear] = useToolDraft("case-converter", "");
  const [copied, setCopied] = useState(false);

  const converters = [
    { label: labels.uppercase, apply: (v: string) => v.toUpperCase() },
    { label: labels.lowercase, apply: (v: string) => v.toLowerCase() },
    { label: labels.titleCase, apply: toTitleCase },
    { label: labels.sentenceCase, apply: toSentenceCase },
    { label: labels.camelCase, apply: toCamelCase },
    { label: labels.snakeCase, apply: toSnakeCase },
    { label: labels.kebabCase, apply: toKebabCase },
  ];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={labels.placeholder}
        rows={10}
        className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />
      <div className="flex flex-wrap gap-2">
        {converters.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setText(item.apply(text))}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium hover:border-violet-300 hover:bg-violet-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-violet-500/40"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleCopy} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
          {copied ? labels.copied : labels.copy}
        </button>
        <button type="button" onClick={clear} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700">
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
