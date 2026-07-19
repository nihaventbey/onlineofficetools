"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Dictionary, Locale } from "@/lib/i18n";
import { toolRegistry } from "@/lib/tools/registry";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

export default function CommandPalette({ locale, dict }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return toolRegistry.slice(0, 8);
    return toolRegistry
      .filter((t) => {
        const labels = dict.tools[t.dictKey];
        return (
          t.slug.includes(query) ||
          labels.title.toLowerCase().includes(query) ||
          t.keywords.some((k) => k.includes(query))
        );
      })
      .slice(0, 12);
  }, [q, dict]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 hover:border-blue-300 lg:inline-flex"
        aria-label={dict.common.commandPalette}
      >
        <span>⌘K</span>
        <span className="hidden xl:inline">{dict.common.search}</span>
      </button>
      {open && mounted
        ? createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={dict.common.commandPalette}
              className="w-full border-b border-slate-100 px-4 py-3 text-sm outline-none"
            />
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={`/${locale}/tools/${tool.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50"
                  >
                    <span className="text-lg" aria-hidden>
                      {tool.emoji ?? "🛠️"}
                    </span>
                    <span className="font-medium text-slate-900">
                      {dict.tools[tool.dictKey].title}
                    </span>
                    <span className="text-xs text-slate-400">
                      {dict.categories[tool.category]}
                    </span>
                  </Link>
                </li>
              ))}
              {!results.length ? (
                <li className="px-3 py-6 text-center text-sm text-slate-500">
                  {dict.common.noResults}
                </li>
              ) : null}
            </ul>
          </div>
        </div>,
        document.body,
      )
        : null}
    </>
  );
}
