"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CmsToolCard } from "@/lib/cms";
import type { Dictionary, Locale } from "@/lib/i18n";
import { useRecentTools } from "@/lib/state/useRecentTools";
import { categoryStyles } from "@/lib/tools/categories";
import { getToolBySlug } from "@/lib/tools/registry";

type Props = {
  locale: Locale;
  tools: CmsToolCard[];
  dict: Dictionary;
};

export default function HeroInstantSearch({ locale, tools, dict }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { recent, favorites } = useRecentTools();

  // Filter tools based on query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const parts = q.split(/\s+/).filter(Boolean);

    return tools
      .filter((tool) => {
        const meta = getToolBySlug(tool.slug);
        const labels = meta ? dict.tools[meta.dictKey] : null;
        const haystack = [
          tool.title,
          tool.description,
          tool.slug,
          tool.category,
          labels?.title,
          labels?.description,
          labels?.metaDescription,
          ...(meta?.keywords ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return parts.every((part) => haystack.includes(part));
      })
      .slice(0, 7);
  }, [tools, query, dict]);

  // Suggested tools when query is empty but input is focused
  const quickPicks = useMemo(() => {
    if (query.trim()) return [];
    const slugs = Array.from(new Set([...favorites, ...recent])).slice(0, 5);
    return slugs
      .map((slug) => tools.find((t) => t.slug === slug))
      .filter((t): t is CmsToolCard => Boolean(t));
  }, [favorites, recent, tools, query]);

  const activeList = query.trim() ? filtered : quickPicks;

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || activeList.length === 0) {
      if (e.key === "ArrowDown") setIsOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % activeList.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + activeList.length) % activeList.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeList[selectedIndex] || activeList[0];
      if (target) {
        setIsOpen(false);
        router.push(`/${locale}/tools/${target.slug}`);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative mx-auto mt-6 w-full max-w-2xl px-2 sm:px-0">
      {/* Search Bar Container */}
      <div className="relative flex items-center rounded-2xl border border-blue-200/80 bg-white/95 p-1.5 shadow-lg shadow-blue-500/10 backdrop-blur-md transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20">
        <span aria-hidden className="pl-3 text-slate-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={dict.common.searchPlaceholder}
          className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none sm:text-base"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
            aria-label="Clear"
          >
            ✕
          </button>
        ) : (
          <span className="hidden items-center gap-1 pr-3 text-xs font-semibold text-slate-400 sm:flex">
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 shadow-xs">
              ↵ Enter
            </kbd>
          </span>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && activeList.length > 0 && (
        <div className="absolute inset-x-2 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl shadow-slate-900/15 sm:inset-x-0">
          <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            {query.trim()
              ? `${activeList.length} ${dict.common.tools}`
              : (dict.common.quickSuggestions || dict.common.recentTools || "Quick Suggestions")}
          </div>
          <ul className="space-y-1">
            {activeList.map((tool, idx) => {
              const meta = getToolBySlug(tool.slug);
              const style = categoryStyles[tool.category];
              const isSelected = idx === selectedIndex;

              return (
                <li key={tool.slug}>
                  <Link
                    href={`/${locale}/tools/${tool.slug}`}
                    onClick={() => setIsOpen(false)}
                    className={`flex min-h-[44px] items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      isSelected
                        ? "bg-blue-50 text-blue-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base shadow-xs ${style.bg} ${style.text}`}
                      >
                        {meta?.emoji ?? "🛠️"}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {tool.title}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {tool.description}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-600">
                      {dict.categories[tool.category]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
