"use client";

import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { useRecentTools } from "@/lib/state/useRecentTools";
import { getToolBySlug, isToolAvailableInLocale } from "@/lib/tools/registry";
import { categoryStyles } from "@/lib/tools/categories";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

export default function RecentTools({ locale, dict }: Props) {
  const { recent, favorites } = useRecentTools();
  const favItems = favorites
    .map((slug) => getToolBySlug(slug))
    .filter(
      (tool): tool is NonNullable<typeof tool> =>
        Boolean(tool) && isToolAvailableInLocale(tool!.slug, locale),
    )
    .slice(0, 6);
  const recentItems = recent
    .map((slug) => getToolBySlug(slug))
    .filter(
      (tool): tool is NonNullable<typeof tool> =>
        Boolean(tool) && isToolAvailableInLocale(tool!.slug, locale),
    )
    .slice(0, 6);

  const empty = !favItems.length && !recentItems.length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold text-slate-900">
        {dict.common.yourTools}
      </h2>
      {empty ? (
        <p className="mt-2 text-sm text-slate-500">{dict.common.yourToolsHint}</p>
      ) : (
        <div className="mt-3 space-y-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {dict.common.favoriteTools}
            </h3>
            {favItems.length ? (
              <div className="flex flex-wrap gap-2">
                {favItems.map((tool) => {
                  if (!tool) return null;
                  const style = categoryStyles[tool.category];
                  return (
                    <Link
                      key={tool.slug}
                      href={`/${locale}/tools/${tool.slug}`}
                      className={`inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium ${style.bg} ${style.text}`}
                    >
                      {dict.tools[tool.dictKey].title}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">{dict.common.favoritesEmpty}</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {dict.common.recentTools}
            </h3>
            {recentItems.length ? (
              <div className="flex flex-wrap gap-2">
                {recentItems.map((tool) => {
                  if (!tool) return null;
                  return (
                    <Link
                      key={tool.slug}
                      href={`/${locale}/tools/${tool.slug}`}
                      className="inline-flex min-h-9 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 hover:border-blue-300"
                    >
                      {dict.tools[tool.dictKey].title}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">{dict.common.recentEmpty}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
