"use client";

import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { useRecentTools } from "@/lib/state/useRecentTools";
import { getToolBySlug } from "@/lib/tools/registry";
import { categoryStyles } from "@/lib/tools/categories";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

export default function RecentTools({ locale, dict }: Props) {
  const { recent, favorites } = useRecentTools();
  const favItems = favorites
    .map((slug) => getToolBySlug(slug))
    .filter(Boolean)
    .slice(0, 6);
  const recentItems = recent
    .map((slug) => getToolBySlug(slug))
    .filter(Boolean)
    .slice(0, 6);

  if (!favItems.length && !recentItems.length) return null;

  return (
    <div className="space-y-6">
      {favItems.length ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {dict.common.favoriteTools}
          </h2>
          <div className="flex flex-wrap gap-2">
            {favItems.map((tool) => {
              if (!tool) return null;
              const style = categoryStyles[tool.category];
              return (
                <Link
                  key={tool.slug}
                  href={`/${locale}/tools/${tool.slug}`}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium ${style.bg} ${style.text}`}
                >
                  {dict.tools[tool.dictKey].title}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
      {recentItems.length ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {dict.common.recentTools}
          </h2>
          <div className="flex flex-wrap gap-2">
            {recentItems.map((tool) => {
              if (!tool) return null;
              return (
                <Link
                  key={tool.slug}
                  href={`/${locale}/tools/${tool.slug}`}
                  className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:border-blue-300"
                >
                  {dict.tools[tool.dictKey].title}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
