"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["urlEncoder"] };
type Draft = { input: string; output: string };

export default function UrlEncoder({ labels }: Props) {
  const [draft, setDraft, clear] = useToolDraft<Draft>("url-encoder", {
    input: "",
    output: "",
  });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  function encode() {
    try {
      setDraft({ ...draft, output: encodeURIComponent(draft.input) });
      setError("");
    } catch {
      setError(labels.error);
    }
  }

  function decode() {
    try {
      setDraft({ ...draft, output: decodeURIComponent(draft.input) });
      setError("");
    } catch {
      setError(labels.error);
    }
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
      <textarea
        value={draft.input}
        onChange={(e) => setDraft({ ...draft, input: e.target.value })}
        placeholder={labels.placeholder}
        rows={6}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={encode} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500">
          {labels.encode}
        </button>
        <button type="button" onClick={decode} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.decode}
        </button>
        <button type="button" onClick={handleCopy} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {copied ? labels.copied : labels.copy}
        </button>
        <button type="button" onClick={clear} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <textarea
        readOnly
        value={draft.output}
        rows={6}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
      />
    </div>
  );
}
