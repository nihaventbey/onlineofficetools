"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { useRecentTools } from "@/lib/state/useRecentTools";
import { getToolBySlug } from "@/lib/tools/registry";

type Props = {
  locale: Locale;
  dict: Dictionary;
  compact?: boolean;
};

type Tab = "favorites" | "recent";

export default function QuickAccessMenu({ locale, dict, compact }: Props) {
  const { recent, favorites } = useRecentTools();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("favorites");
  const rootRef = useRef<HTMLDivElement>(null);

  const favItems = favorites
    .map((slug) => getToolBySlug(slug))
    .filter(Boolean)
    .slice(0, 6);
  const recentItems = recent
    .map((slug) => getToolBySlug(slug))
    .filter(Boolean)
    .slice(0, 6);
  const count = favorites.length + recent.length;
  const items = tab === "favorites" ? favItems : recentItems;
  const emptyLabel =
    tab === "favorites" ? dict.common.favoritesEmpty : dict.common.recentEmpty;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-600 hover:border-blue-300 ${
          compact ? "w-full justify-center" : ""
        }`}
      >
        <span aria-hidden>★</span>
        <span className={compact ? "" : "hidden sm:inline"}>
          {dict.common.quickAccess}
        </span>
        {count > 0 ? (
          <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={dict.common.quickAccess}
          className={`absolute z-50 mt-2 w-[min(92vw,20rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl ${
            compact ? "left-0" : "right-0"
          }`}
        >
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            {(
              [
                ["favorites", dict.common.favoriteTools],
                ["recent", dict.common.recentTools],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${
                  tab === id
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {items.length ? (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {items.map((tool) => {
                if (!tool) return null;
                return (
                  <li key={tool.slug}>
                    <Link
                      href={`/${locale}/tools/${tool.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-800 hover:bg-slate-50"
                    >
                      <span aria-hidden>{tool.emoji ?? "🛠️"}</span>
                      <span className="truncate font-medium">
                        {dict.tools[tool.dictKey].title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-1 py-4 text-center text-sm text-slate-500">
              {emptyLabel}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
