"use client";

import { useMemo, useState } from "react";
import ToolGrid from "@/components/tools/ToolGrid";
import type { CmsToolCard } from "@/lib/cms";
import type { Dictionary, Locale } from "@/lib/i18n";
import { toolCategories, type ToolCategory } from "@/lib/tools/categories";

type ToolSearchProps = {
  locale: Locale;
  tools: CmsToolCard[];
  dict: Dictionary;
};

export default function ToolSearch({ locale, tools, dict }: ToolSearchProps) {
  const [query, setQuery] = useState("");
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <span className="sr-only">{dict.common.search}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.common.searchPlaceholder}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/20 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              category === "all"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {dict.common.allTools}
          </button>
          {toolCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                category === cat
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {dict.categories[cat]}
            </button>
          ))}
        </div>
      </div>
      <ToolGrid locale={locale} tools={filtered} dict={dict} />
    </div>
  );
}
