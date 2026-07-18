"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  dict: Dictionary;
  slug: string;
};

export default function ToolFeedback({ dict, slug }: Props) {
  const [done, setDone] = useState(false);

  function vote(helpful: boolean) {
    try {
      const key = "oot-tool-feedback";
      const prev = JSON.parse(localStorage.getItem(key) || "{}") as Record<
        string,
        boolean
      >;
      prev[slug] = helpful;
      localStorage.setItem(key, JSON.stringify(prev));
    } catch {
      /* ignore */
    }
    setDone(true);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
      {done ? (
        <p className="font-medium text-emerald-700">{dict.common.thanksFeedback}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span>{dict.common.wasHelpful}</span>
          <button
            type="button"
            onClick={() => vote(true)}
            className="min-h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            {dict.common.yes}
          </button>
          <button
            type="button"
            onClick={() => vote(false)}
            className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold hover:bg-slate-50"
          >
            {dict.common.no}
          </button>
        </div>
      )}
    </div>
  );
}
