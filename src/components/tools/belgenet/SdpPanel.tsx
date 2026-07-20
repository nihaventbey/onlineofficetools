"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useBelgenetDraft } from "@/lib/ebys/belgenetDraft";

type Labels = Dictionary["tools"]["belgenetPrep"]["sdp"];

type SdpEntry = {
  code: string;
  name: string;
  planId?: string;
  retention?: string;
  archiveGrade?: string;
  note?: string;
  sectionOnly?: boolean;
};

type SdpPlan = { id: string; label: string };

type SdpPayload = {
  version: string;
  updatedAt: string;
  sourcePage?: string;
  entries: SdpEntry[];
  plans?: SdpPlan[];
};

const STALE_VERSIONS = new Set(["fallback-sample"]);

export default function SdpPanel({ labels }: { labels: Labels }) {
  const { draft, setDraft } = useBelgenetDraft();
  const [data, setData] = useState<SdpPayload | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
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

  const isStale = data ? STALE_VERSIONS.has(data.version) : false;

  const results = useMemo(() => {
    if (!data?.entries) return [];
    let list = data.entries;
    if (planFilter !== "all") {
      list = list.filter((e) => e.planId === planFilter);
    }
    if (!debounced) return list.slice(0, 50);
    return list
      .filter(
        (e) =>
          e.code.toLowerCase().includes(debounced) ||
          e.name.toLowerCase().includes(debounced),
      )
      .slice(0, 100);
  }, [data, debounced, planFilter]);

  const planOptions = useMemo(() => {
    const plans = data?.plans ?? [];
    return [
      { id: "all", label: labels.planAll },
      ...plans.map((p) => ({ id: p.id, label: p.label })),
    ];
  }, [data?.plans, labels.planAll]);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  function selectEntry(e: SdpEntry) {
    if (e.sectionOnly) return;
    setDraft({ sdpCode: e.code, sdpName: e.name });
  }

  return (
    <div className="space-y-4">
      {isStale || error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
        >
          {labels.staleWarning}{" "}
          <a
            href={
              data?.sourcePage ??
              "https://www.devletarsivleri.gov.tr/Sayfalar/Sayfa.aspx?h=EC4EE38996FE1DD2D040D483800B793116ED6F1FD94ED1E517B581F5E16F395B&icerik=20"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            {labels.officialSource}
          </a>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {planOptions.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlanFilter(p.id)}
            className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${
              planFilter === p.id
                ? "bg-amber-700 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

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

      {data ? (
        <>
          {draft.sdpCode ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {labels.selected}:{" "}
              <span className="font-mono font-semibold">{draft.sdpCode}</span> —{" "}
              {draft.sdpName}
            </p>
          ) : null}

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
                  key={`${e.planId ?? ""}-${e.code}-${e.name}`}
                  className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold text-slate-900">
                      {e.code}
                      {e.sectionOnly ? (
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                          {labels.sectionOnly}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm text-slate-700">{e.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {e.retention ? `${labels.retention}: ${e.retention}` : ""}
                      {e.archiveGrade
                        ? ` · ${labels.archiveGrade}: ${e.archiveGrade}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {!e.sectionOnly ? (
                      <button
                        type="button"
                        onClick={() => selectEntry(e)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                          draft.sdpCode === e.code
                            ? "bg-emerald-700 text-white"
                            : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {labels.select}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => copyCode(e.code)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {copied === e.code ? labels.copied : labels.copyCode}
                    </button>
                  </div>
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
