"use client";

import { useEffect, useMemo, useState } from "react";
import type { OrgParty } from "@/lib/ebys/arzRicaRelation";

export type DetsisCatalog = {
  version: string;
  updatedAt: string;
  incomplete?: boolean;
  entries: OrgParty[];
};

type Props = {
  label: string;
  value: OrgParty | null;
  onChange: (party: OrgParty | null) => void;
  catalog: OrgParty[];
  searchPlaceholder: string;
  clearLabel: string;
  noResults: string;
  loading?: boolean;
};

export default function DetsisPicker({
  label,
  value,
  onChange,
  catalog,
  searchPlaceholder,
  clearLabel,
  noResults,
  loading,
}: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(
      () => setDebounced(query.trim().toLowerCase()),
      180,
    );
    return () => window.clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    if (!debounced) return catalog.slice(0, 12);
    return catalog
      .filter(
        (e) =>
          e.id.includes(debounced) ||
          e.name.toLocaleLowerCase("tr-TR").includes(debounced),
      )
      .slice(0, 40);
  }, [catalog, debounced]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {value ? (
        <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="min-w-0">
            <p className="font-mono text-xs text-slate-500">{value.id}</p>
            <p className="text-sm font-semibold text-slate-900">{value.name}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            {clearLabel}
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-amber-400 focus:ring-2"
          />
          {loading ? (
            <p className="mt-1 text-xs text-slate-400">…</p>
          ) : null}
          {open ? (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {results.length === 0 ? (
                <li className="px-3 py-3 text-sm text-slate-500">{noResults}</li>
              ) : (
                results.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-amber-50"
                      onClick={() => {
                        onChange(e);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="font-mono text-xs text-slate-500">
                        {e.id}
                      </span>
                      <span className="text-sm text-slate-800">{e.name}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
