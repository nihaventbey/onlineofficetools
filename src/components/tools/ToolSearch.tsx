"use client";

import { useMemo, useState } from "react";
import ToolGrid from "@/components/tools/ToolGrid";
import type { CmsToolCard } from "@/lib/cms";
import type { Dictionary, Locale } from "@/lib/i18n";
import {
  categoryStyles,
  toolCategories,
  type ToolCategory,
} from "@/lib/tools/categories";

type ToolSearchProps = {
  locale: Locale;
  tools: CmsToolCard[];
  dict: Dictionary;
  /** Controlled query from hero search (optional). */
  initialQuery?: string;
  heroMode?: boolean;
};

export default function ToolSearch({
  locale,
  tools,
  dict,
  initialQuery = "",
  heroMode = false,
}: ToolSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<ToolCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      if (category !== "all" && tool.category !== category) return false;
      if (!q) return true;
      return (
        tool.title.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.slug.includes(q)
      );
    });
  }, [tools, query, category]);

  return (
    <div className="space-y-6">
      <div className={`flex flex-col gap-3 ${heroMode ? "" : "sm:flex-row sm:items-center"}`}>
        <label className="relative block flex-1">
          <span className="sr-only">{dict.common.search}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.common.searchPlaceholder}
            className={`w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 ${
              heroMode ? "py-4 text-base" : "py-3"
            }`}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`min-h-11 rounded-full px-3.5 text-xs font-semibold ${
              category === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {dict.common.allTools}
          </button>
          {toolCategories.map((cat) => {
            const style = categoryStyles[cat];
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`min-h-11 rounded-full px-3.5 text-xs font-semibold ${
                  active
                    ? `${style.bg} ${style.text} ring-2 ring-offset-1 ring-current`
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {dict.categories[cat]}
              </button>
            );
          })}
        </div>
      </div>
      <ToolGrid locale={locale} tools={filtered} dict={dict} />
    </div>
  );
}
