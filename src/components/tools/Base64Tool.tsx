"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Draft = { input: string; output: string };
type Props = { labels: Dictionary["tools"]["base64"] };

export default function Base64Tool({ labels }: Props) {
  const [draft, setDraft, clear] = useToolDraft<Draft>("base64", {
    input: "",
    output: "",
  });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  function encode() {
    try {
      setOutput(btoa(unescape(encodeURIComponent(draft.input))));
      setError("");
    } catch {
      setError(labels.error);
    }
  }

  function decode() {
    try {
      setOutput(decodeURIComponent(escape(atob(draft.input.trim()))));
      setError("");
    } catch {
      setError(labels.error);
    }
  }

  function setOutput(output: string) {
    setDraft({ ...draft, output });
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
      <textarea
        value={draft.input}
        onChange={(e) => setDraft({ ...draft, input: e.target.value })}
        placeholder={labels.inputPlaceholder}
        rows={8}
        className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={encode} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
          {labels.encode}
        </button>
        <button type="button" onClick={decode} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700">
          {labels.decode}
        </button>
        <button type="button" onClick={handleCopy} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700">
          {copied ? labels.copied : labels.copy}
        </button>
        <button type="button" onClick={clear} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700">
          {labels.clear}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <textarea
        readOnly
        value={draft.output}
        rows={8}
        className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />
    </div>
  );
}
