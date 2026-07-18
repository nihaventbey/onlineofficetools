"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { CmsToolCard } from "@/lib/cms";
import type { Dictionary, Locale } from "@/lib/i18n";
import { useRecentTools } from "@/lib/state/useRecentTools";
import { categoryStyles, type ToolCategory } from "@/lib/tools/categories";
import ToolCard from "@/components/tools/ToolCard";

type ToolPageShellProps = {
  locale: Locale;
  dict: Dictionary;
  title: string;
  description: string;
  category: ToolCategory;
  categoryLabel: string;
  related: CmsToolCard[];
  slug: string;
  children: React.ReactNode;
};

export default function ToolPageShell({
  locale,
  dict,
  title,
  description,
  category,
  categoryLabel,
  related,
  slug,
  children,
}: ToolPageShellProps) {
  const styles = categoryStyles[category];
  const { pushRecent, favorites, toggleFavorite } = useRecentTools();
  const isFav = favorites.includes(slug);

  useEffect(() => {
    pushRecent(slug);
  }, [slug, pushRecent]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href={`/${locale}`} className="hover:text-blue-600">
          {dict.common.breadcrumbHome}
        </Link>
        <span>/</span>
        <Link
          href={`/${locale}/categories/${category}`}
          className="hover:text-blue-600"
        >
          {categoryLabel}
        </Link>
        <span>/</span>
        <span className="text-slate-800">{title}</span>
      </nav>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles.bg} ${styles.text}`}
          >
            {categoryLabel}
          </span>
          <button
            type="button"
            onClick={() => toggleFavorite(slug)}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-amber-300 hover:text-amber-700"
          >
            {isFav ? `★ ${dict.common.removeFavorite}` : `☆ ${dict.common.addFavorite}`}
          </button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-slate-600">
          {description}
        </p>
        <p className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {dict.common.trustOnDevice}
        </p>
      </header>

      {children}

      {related.length > 0 ? (
        <section className="space-y-4 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-semibold text-slate-900">
            {dict.common.relatedTools}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((tool) => (
              <ToolCard
                key={tool.slug}
                locale={locale}
                slug={tool.slug}
                title={tool.title}
                description={tool.description}
                categoryLabel={dict.categories[tool.category]}
                cta={dict.common.openTool}
                compact
                coverUrl={tool.coverUrl}
                badgeLabels={{
                  new: dict.common.newBadge,
                  popular: dict.common.popularBadge,
                  beta: dict.common.betaBadge,
                }}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
