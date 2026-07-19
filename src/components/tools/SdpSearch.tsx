"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = { labels: Dictionary["tools"]["sdpSearch"] };

type SdpEntry = {
  code: string;
  name: string;
  retention?: string;
  note?: string;
};

type SdpPayload = {
  version: string;
  updatedAt: string;
  entries: SdpEntry[];
};

export default function SdpSearch({ labels }: Props) {
  const [data, setData] = useState<SdpPayload | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/sdp.json")
      .then((r) => {
        if (!r.ok) throw new Error("fail");
        return r.json() as Promise<SdpPayload>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim().toLowerCase()), 200);
    return () => window.clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    if (!data?.entries) return [];
    if (!debounced) return data.entries.slice(0, 40);
    return data.entries
      .filter(
        (e) =>
          e.code.toLowerCase().includes(debounced) ||
          e.name.toLowerCase().includes(debounced),
      )
      .slice(0, 80);
  }, [data, debounced]);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={labels.searchPlaceholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-amber-400 focus:ring-2"
      />

      {!data && !error ? (
        <p className="text-sm text-slate-500">{labels.loading}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {labels.loadError}
        </p>
      ) : null}

      {data ? (
        <>
          <p className="text-xs text-slate-500">
            {labels.results}: {results.length}
          </p>
          <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
            {results.length === 0 ? (
              <li className="px-3 py-4 text-sm text-slate-500">
                {labels.noResults}
              </li>
            ) : (
              results.map((e) => (
                <li
                  key={`${e.code}-${e.name}`}
                  className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold text-slate-900">
                      {e.code}
                    </p>
                    <p className="text-sm text-slate-700">{e.name}</p>
                    {e.retention ? (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {labels.retention}: {e.retention}
                      </p>
                    ) : null}
                    {e.note ? (
                      <p className="text-xs text-slate-400">
                        {labels.note}: {e.note}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCode(e.code)}
                    className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {copied === e.code ? labels.copied : labels.copyCode}
                  </button>
                </li>
              ))
            )}
          </ul>
          <p className="text-xs text-slate-400">
            {labels.dataVersion}: {data.version} · {data.updatedAt.slice(0, 10)}
          </p>
        </>
      ) : null}
    </div>
  );
}
