"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["jsonFormatter"] };

export default function JsonFormatter({ labels }: Props) {
  const [text, setText, clear] = useToolDraft("json-formatter", "");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [error, setError] = useState("");

  const lineCount = useMemo(
    () => (text ? text.split(/\r\n|\r|\n/).length : 0),
    [text],
  );

  function format(minify = false) {
    try {
      const parsed = JSON.parse(text);
      setText(JSON.stringify(parsed, null, minify ? 0 : 2));
      setStatus("valid");
      setError("");
    } catch (e) {
      setStatus("invalid");
      setError(e instanceof Error ? e.message : labels.invalid);
    }
  }

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
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setStatus("idle");
          }}
          placeholder={labels.placeholder}
          rows={14}
          className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm leading-relaxed outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => format(false)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            {labels.format}
          </button>
          <button type="button" onClick={() => format(true)} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
            {labels.minify}
          </button>
          <button type="button" onClick={handleCopy} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700">
            {copied ? labels.copied : labels.copy}
          </button>
          <button type="button" onClick={clear} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700">
            {labels.clear}
          </button>
          <span className="ml-auto text-xs text-zinc-500">{lineCount} lines</span>
        </div>
        {status !== "idle" ? (
          <p className={`mt-3 text-sm ${status === "valid" ? "text-emerald-600" : "text-red-600"}`}>
            {status === "valid" ? labels.valid : `${labels.invalid}: ${error}`}
          </p>
        ) : null}
      </section>
    </div>
  );
}
