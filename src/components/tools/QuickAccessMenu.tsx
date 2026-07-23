"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { useRecentTools } from "@/lib/state/useRecentTools";
import { getToolBySlug, isToolAvailableInLocale } from "@/lib/tools/registry";

type Props = {
  locale: Locale;
  dict: Dictionary;
  /** Icon-only header button (hides label). */
  compact?: boolean;
  /**
   * `dropdown` = header popover (default).
   * `inline` = render lists directly (mobile drawer; no nested popup).
   */
  variant?: "dropdown" | "inline";
  className?: string;
};

type Tab = "favorites" | "recent";

function ToolList({
  locale,
  dict,
  items,
  emptyLabel,
  onNavigate,
}: {
  locale: Locale;
  dict: Dictionary;
  items: ReturnType<typeof getToolBySlug>[];
  emptyLabel: string;
  onNavigate?: () => void;
}) {
  if (!items.length) {
    return (
      <p className="px-1 py-4 text-center text-sm text-slate-500">{emptyLabel}</p>
    );
  }

  return (
    <ul className="max-h-64 space-y-1 overflow-y-auto">
      {items.map((tool) => {
        if (!tool) return null;
        return (
          <li key={tool.slug}>
            <Link
              href={`/${locale}/tools/${tool.slug}`}
              onClick={onNavigate}
              className="flex min-h-11 items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-800 transition hover:bg-slate-50"
            >
              <span aria-hidden className="text-base">
                {tool.emoji ?? "🛠️"}
              </span>
              <span className="truncate font-medium">
                {dict.tools[tool.dictKey].title}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function QuickAccessMenu({
  locale,
  dict,
  compact,
  variant = "dropdown",
  className = "",
}: Props) {
  const { recent, favorites, clearFavorites, clearRecent, clearAll } =
    useRecentTools();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("favorites");
  const rootRef = useRef<HTMLDivElement>(null);

  const favItems = favorites
    .map((slug) => getToolBySlug(slug))
    .filter(
      (tool): tool is NonNullable<typeof tool> =>
        Boolean(tool) && isToolAvailableInLocale(tool!.slug, locale),
    )
    .slice(0, 12);
  const recentItems = recent
    .map((slug) => getToolBySlug(slug))
    .filter(
      (tool): tool is NonNullable<typeof tool> =>
        Boolean(tool) && isToolAvailableInLocale(tool!.slug, locale),
    )
    .slice(0, 12);
  const count = favorites.length + recent.length;
  const items = tab === "favorites" ? favItems : recentItems;
  const emptyLabel =
    tab === "favorites" ? dict.common.favoritesEmpty : dict.common.recentEmpty;

  useEffect(() => {
    if (variant !== "dropdown") return;
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
  }, [variant]);

  function ClearBar() {
    if (!favorites.length && !recent.length) return null;
    return (
      <div className="mb-2 flex flex-wrap items-center justify-end gap-1.5 border-b border-slate-100 pb-2">
        {favorites.length > 0 ? (
          <button
            type="button"
            onClick={() => clearFavorites()}
            className="min-h-8 rounded-lg px-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
          >
            {dict.common.clearFavorites}
          </button>
        ) : null}
        {recent.length > 0 ? (
          <button
            type="button"
            onClick={() => clearRecent()}
            className="min-h-8 rounded-lg px-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
          >
            {dict.common.clearRecent}
          </button>
        ) : null}
        {favorites.length > 0 && recent.length > 0 ? (
          <button
            type="button"
            onClick={() => clearAll()}
            className="min-h-8 rounded-lg px-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
          >
            {dict.common.clearQuickAccess}
          </button>
        ) : null}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`space-y-3 ${className}`}>
        <ClearBar />
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
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
              className={`min-h-10 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                tab === id
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <ToolList
          locale={locale}
          dict={dict}
          items={items}
          emptyLabel={emptyLabel}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        title={dict.common.quickAccess}
        className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
          compact ? "w-11 shrink-0 px-0" : "min-w-11"
        }`}
      >
        <span aria-hidden>★</span>
        {!compact ? (
          <span className="hidden lg:inline">{dict.common.quickAccess}</span>
        ) : null}
        {count > 0 ? (
          <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={dict.common.quickAccess}
          className="absolute right-0 z-50 mt-2 w-[min(92vw,20rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
        >
          <ClearBar />
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
                className={`min-h-9 rounded-lg px-2 py-1.5 text-xs font-semibold ${
                  tab === id
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <ToolList
            locale={locale}
            dict={dict}
            items={items}
            emptyLabel={emptyLabel}
            onNavigate={() => setOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
