"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  dict: Dictionary;
  slug: string;
};

const LOCAL_KEY = "oot-tool-feedback";

function clientHash(): string {
  try {
    const existing = localStorage.getItem("oot-client-hash");
    if (existing) return existing;
    const hash =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `h-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("oot-client-hash", hash);
    return hash;
  } catch {
    return `h-${Date.now()}`;
  }
}

export default function ToolFeedback({ dict, slug }: Props) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}") as Record<
        string,
        boolean
      >;
      if (slug in prev) setDone(true);
    } catch {
      /* ignore */
    }
  }, [slug]);

  async function vote(helpful: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}") as Record<
        string,
        boolean
      >;
      prev[slug] = helpful;
      localStorage.setItem(LOCAL_KEY, JSON.stringify(prev));
    } catch {
      /* ignore */
    }

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.rpc("submit_tool_feedback", {
        p_slug: slug,
        p_vote: helpful ? "yes" : "no",
        p_client_hash: clientHash(),
      });
    }

    setBusy(false);
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
            disabled={busy}
            onClick={() => void vote(true)}
            className="min-h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {dict.common.yes}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void vote(false)}
            className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            {dict.common.no}
          </button>
        </div>
      )}
    </div>
  );
}
