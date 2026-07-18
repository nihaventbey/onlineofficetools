"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Draft = {
  length: number;
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
  password: string;
};

type Props = { labels: Dictionary["tools"]["passwordGenerator"] };

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMS = "0123456789";
const SYMS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

function randomFrom(charset: string, count: number): string {
  const arr = new Uint32Array(count);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < count; i++) {
    out += charset[arr[i] % charset.length];
  }
  return out;
}

export default function PasswordGenerator({ labels }: Props) {
  const [draft, setDraft, clear] = useToolDraft<Draft>("password-generator", {
    length: 16,
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
    password: "",
  });
  const [copied, setCopied] = useState(false);

  const strength = useMemo(() => {
    const len = draft.password.length;
    let score = 0;
    if (len >= 12) score++;
    if (len >= 16) score++;
    if (/[A-Z]/.test(draft.password) && /[a-z]/.test(draft.password)) score++;
    if (/\d/.test(draft.password)) score++;
    if (/[^A-Za-z0-9]/.test(draft.password)) score++;
    if (score <= 2) return labels.weak;
    if (score <= 4) return labels.medium;
    return labels.strong;
  }, [draft.password, labels]);

  function generate() {
    let charset = "";
    if (draft.upper) charset += UPPER;
    if (draft.lower) charset += LOWER;
    if (draft.numbers) charset += NUMS;
    if (draft.symbols) charset += SYMS;
    if (!charset) charset = LOWER;
    const length = Math.min(128, Math.max(4, draft.length));
    setDraft({ ...draft, length, password: randomFrom(charset, length) });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(draft.password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-lg break-all dark:border-zinc-700 dark:bg-zinc-950">
        {draft.password || "••••••••••••••••"}
      </div>
      <p className="text-sm text-zinc-500">
        {labels.strength}: <span className="font-medium text-zinc-900 dark:text-white">{strength}</span>
      </p>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{labels.length}: {draft.length}</span>
        <input
          type="range"
          min={4}
          max={64}
          value={draft.length}
          onChange={(e) => setDraft({ ...draft, length: Number(e.target.value) })}
          className="w-full"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ["upper", labels.uppercase],
            ["lower", labels.lowercase],
            ["numbers", labels.numbers],
            ["symbols", labels.symbols],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
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
    </div>
  );
}
