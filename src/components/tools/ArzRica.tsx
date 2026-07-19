"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import {
  applyClosing,
  findForbiddenPhrases,
  formatClosing,
  type ArzRicaAudience,
  type ArzRicaVariant,
} from "@/lib/ebys/arzRica";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["arzRica"] };

const AUDIENCES: ArzRicaAudience[] = [
  "lower",
  "upper",
  "peer",
  "mixed",
  "private",
];

export default function ArzRica({ labels }: Props) {
  const [text, setText, clear] = useToolDraft("arz-rica", "");
  const [audience, setAudience] = useState<ArzRicaAudience>("upper");
  const [variant, setVariant] = useState<ArzRicaVariant>("plain");
  const [copied, setCopied] = useState(false);

  const closing = useMemo(
    () => formatClosing(audience, variant),
    [audience, variant],
  );
  const forbidden = useMemo(() => findForbiddenPhrases(text), [text]);

  const audienceLabels: Record<ArzRicaAudience, string> = {
    lower: labels.audienceLower,
    upper: labels.audienceUpper,
    peer: labels.audiencePeer,
    mixed: labels.audienceMixed,
    private: labels.audiencePrivate,
  };

  function handleApply() {
    setText(applyClosing(text, closing));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text || closing);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">
          {labels.audienceLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAudience(a)}
              className={`min-h-10 rounded-xl px-3 text-sm font-semibold transition ${
                audience === a
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {audienceLabels[a]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["plain", labels.closingLabel],
            ["geregi", labels.geregi],
            ["bilgi", labels.bilgi],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setVariant(key)}
            className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${
              variant === key
                ? "bg-amber-100 text-amber-900"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <span className="font-semibold">{labels.closingLabel}: </span>
        {closing}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder={labels.textPlaceholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-amber-400 focus:ring-2"
      />

      {forbidden.length ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
        >
          {labels.forbiddenWarning}:{" "}
          {forbidden.map((f) => `“${f}”`).join(", ")}
        </p>
      ) : null}

      <p className="text-xs text-slate-500">{labels.disclaimer}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleApply}
          className="min-h-10 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700"
        >
          {labels.apply}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {copied ? labels.copied : labels.copy}
        </button>
        <button
          type="button"
          onClick={clear}
          className="min-h-10 rounded-xl px-4 text-sm font-medium text-slate-500 hover:bg-slate-50"
        >
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
