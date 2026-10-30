"use client";

import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { ToolCategory } from "@/lib/tools/categories";
import { categoryStyles } from "@/lib/tools/categories";
import { toolsByCategory } from "@/lib/tools/registry";

type Props = {
  locale: Locale;
  dict: Dictionary;
  currentSlug: string;
  category: ToolCategory;
};

export default function RelatedToolsBar({
  locale,
  dict,
  currentSlug,
  category,
}: Props) {
  const categoryTools = toolsByCategory(category);

  // If there are less than 2 tools in the category, no switcher needed
  if (categoryTools.length < 2) return null;

  const style = categoryStyles[category];

  return (
    <div className="mb-6 -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 py-1 text-xs no-scrollbar">
      <span className="shrink-0 font-semibold text-slate-600">
        {dict.categories[category]}:
      </span>
      <div className="flex items-center gap-1.5">
        {categoryTools.map((tool) => {
          const isCurrent = tool.slug === currentSlug;
          const title = dict.tools[tool.dictKey]?.title || tool.slug;

          return (
            <Link
              key={tool.slug}
              href={`/${locale}/tools/${tool.slug}`}
              className={`inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition active:scale-95 ${
                isCurrent
                  ? `${style.bg} ${style.text} font-bold ring-1 ring-current`
                  : "bg-white/90 text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span aria-hidden>{tool.emoji ?? "🛠️"}</span>
              <span className="truncate max-w-[140px] sm:max-w-none">{title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
