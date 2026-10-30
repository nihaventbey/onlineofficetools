"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function RecentToolsStrip({ locale, tools, dict }: Props) {
  const { recent, favorites } = useRecentTools();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Use user's recent & favorites; fallback to featured popular tools if empty
  const userSlugs = Array.from(new Set([...favorites, ...recent])).slice(0, 6);
  const isPersonalized = userSlugs.length > 0;

  const displayTools: CmsToolCard[] = isPersonalized
    ? userSlugs
        .map((slug) => tools.find((t) => t.slug === slug))
        .filter((t): t is CmsToolCard => Boolean(t))
    : tools.slice(0, 5);

  if (displayTools.length === 0) return null;

  return (
    <div className="mx-auto mt-4 w-full max-w-2xl px-2 sm:px-0">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="shrink-0 font-medium text-slate-500">
          {isPersonalized ? (dict.common.recentTools || "Son Kullanılanlar:") : "Popüler:"}
        </span>
        <div className="flex items-center gap-1.5">
          {displayTools.map((tool) => {
            const meta = getToolBySlug(tool.slug);
            const style = categoryStyles[tool.category];
            return (
              <Link
                key={tool.slug}
                href={`/${locale}/tools/${tool.slug}`}
                className={`inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 font-medium text-slate-700 shadow-xs transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 active:scale-95`}
              >
                <span aria-hidden className="text-xs">
                  {meta?.emoji ?? "🛠️"}
                </span>
                <span className="truncate max-w-[130px] sm:max-w-[180px]">
                  {tool.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
