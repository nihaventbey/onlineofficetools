"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = { labels: Dictionary["tools"]["detsis"] };

type DetsisEntry = {
  id: string;
  name: string;
  parentId?: string;
};

type DetsisPayload = {
  version: string;
  updatedAt: string;
  source?: string;
  incomplete?: boolean;
  entries: DetsisEntry[];
};

const ID_RE = /^\d{8}$/;

export default function DetsisTool({ labels }: Props) {
  const [data, setData] = useState<DetsisPayload | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [formatInput, setFormatInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/detsis.json")
      .then((r) => {
        if (!r.ok) throw new Error("fail");
        return r.json() as Promise<DetsisPayload>;
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

  const formatOk =
    formatInput.length === 0 ? null : ID_RE.test(formatInput.replace(/\s/g, ""));

  const results = useMemo(() => {
    if (!data?.entries?.length) return [];
    if (!debounced) return data.entries.slice(0, 30);
    return data.entries
      .filter(
        (e) =>
          e.id.includes(debounced) || e.name.toLowerCase().includes(debounced),
      )
      .slice(0, 60);
  }, [data, debounced]);

  async function copyId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  const openUrl = (id?: string) =>
    id
      ? `https://www.detsis.gov.tr/`
      : "https://www.detsis.gov.tr/";

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {labels.formatLabel}
        </label>
        <input
          value={formatInput}
          onChange={(e) =>
            setFormatInput(e.target.value.replace(/\D/g, "").slice(0, 8))
          }
          inputMode="numeric"
          placeholder="12345678"
          className="w-full max-w-xs rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm outline-none ring-amber-400 focus:ring-2"
        />
        <p className="mt-1 text-xs text-slate-500">{labels.formatHint}</p>
        {formatOk === true ? (
          <p className="mt-1 text-sm text-emerald-700">{labels.formatValid}</p>
        ) : null}
        {formatOk === false ? (
          <p className="mt-1 text-sm text-rose-700">{labels.formatInvalid}</p>
        ) : null}
        {formatOk ? (
          <a
            href={openUrl(formatInput)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-amber-800 underline"
          >
            {labels.openDetsis}
          </a>
        ) : null}
      </div>

      <div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-amber-400 focus:ring-2"
        />
      </div>

      {!data && !error ? (
        <p className="text-sm text-slate-500">{labels.loading}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {labels.loadError}
        </p>
      ) : null}
      {data?.incomplete || (data && data.entries.length === 0) ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {labels.snapshotWarning}
        </p>
      ) : null}

      {data && data.entries.length > 0 ? (
        <>
          <p className="text-xs text-slate-500">
            {labels.results}: {results.length}
          </p>
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
            {results.length === 0 ? (
              <li className="px-3 py-4 text-sm text-slate-500">
                {labels.noResults}
              </li>
            ) : (
              results.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold">{e.id}</p>
                    <p className="text-sm text-slate-700">{e.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => copyId(e.id)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50"
                    >
                      {copied === e.id ? labels.copied : labels.copyId}
                    </button>
                    <a
                      href={openUrl(e.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50"
                    >
                      {labels.openDetsis}
                    </a>
                  </div>
                </li>
              ))
            )}
          </ul>
        </>
      ) : null}

      {data ? (
        <p className="text-xs text-slate-400">
          {labels.dataVersion}: {data.version} · {data.updatedAt.slice(0, 10)}
        </p>
      ) : null}
    </div>
  );
}
