"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { CmsToolCard, CmsToolFaq } from "@/lib/cms";
import type { AdSenseConfig } from "@/lib/adsense";
import type { Dictionary, Locale } from "@/lib/i18n";
import { useRecentTools } from "@/lib/state/useRecentTools";
import { categoryStyles, type ToolCategory } from "@/lib/tools/categories";
import { getToolMeta } from "@/lib/tools/metadata";
import AdSlot from "@/components/AdSlot";
import ToolCard from "@/components/tools/ToolCard";
import ToolFaqHowTo from "@/components/tools/ToolFaqHowTo";
import ToolShareButtons from "@/components/tools/ToolShareButtons";
import { absoluteUrl } from "@/lib/site";

type ToolPageShellProps = {
  locale: Locale;
  dict: Dictionary;
  title: string;
  description: string;
  category: ToolCategory;
  categoryLabel: string;
  related: CmsToolCard[];
  nextStepTools: CmsToolCard[];
  slug: string;
  accepts?: string[];
  cmsFaqs?: CmsToolFaq[] | null;
  cmsHowtoSteps?: string[] | null;
  adConfig?: AdSenseConfig | null;
  showShare?: boolean;
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
  nextStepTools,
  slug,
  accepts,
  cmsFaqs,
  cmsHowtoSteps,
  adConfig,
  showShare = true,
  children,
}: ToolPageShellProps) {
  const styles = categoryStyles[category];
  const meta = getToolMeta(slug);
  const emoji = meta?.emoji ?? "🛠️";
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

      <header
        className={`relative overflow-hidden rounded-3xl border border-slate-200/80 ${styles.heroGradient} p-6 shadow-sm sm:p-8`}
      >
        <div
          className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl ${styles.heroBlob}`}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full blur-2xl ${styles.heroBlob}`}
          aria-hidden
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border bg-white text-3xl shadow-sm sm:h-20 sm:w-20 sm:text-4xl ${styles.border}`}
            aria-hidden
          >
            {emoji}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles.bg} ${styles.text}`}
              >
                {categoryLabel}
              </span>
              <button
                type="button"
                onClick={() => toggleFavorite(slug)}
                className="rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600 backdrop-blur hover:border-amber-300 hover:text-amber-700"
              >
                {isFav
                  ? `★ ${dict.common.removeFavorite}`
                  : `☆ ${dict.common.addFavorite}`}
              </button>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600">
              {description}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {dict.common.trustOnDevice}
              </span>
              <span className="inline-flex items-center rounded-xl bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80">
                {dict.common.trustFree}
              </span>
              <span className="inline-flex items-center rounded-xl bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80">
                {dict.common.trustPrivate}
              </span>
            </div>

            {showShare ? (
              <ToolShareButtons
                dict={dict}
                url={absoluteUrl(`/${locale}/tools/${slug}`)}
                title={title}
                description={description}
              />
            ) : null}
          </div>
        </div>
      </header>

      {children}

      {adConfig ? (
        <AdSlot
          placement="toolInline"
          config={adConfig}
          format="rectangle"
          className="my-2"
          label={dict.common.advertisement}
        />
      ) : null}

      <ToolFaqHowTo
        dict={dict}
        title={title}
        formats={(accepts ?? meta?.accepts ?? []).join(", ") || "—"}
        cmsFaqs={cmsFaqs}
        cmsHowtoSteps={cmsHowtoSteps}
      />

      {nextStepTools.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {dict.common.nextStep}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {nextStepTools.map((tool) => (
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
