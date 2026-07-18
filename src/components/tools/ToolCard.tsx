import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { categoryStyles } from "@/lib/tools/categories";
import { getToolBySlug } from "@/lib/tools/registry";

type ToolCardProps = {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  categoryLabel: string;
  cta: string;
  compact?: boolean;
};

export default function ToolCard({
  locale,
  slug,
  title,
  description,
  categoryLabel,
  cta,
  compact = false,
}: ToolCardProps) {
  const meta = getToolBySlug(slug);
  const icon = meta?.icon ?? "•";
  const styles = categoryStyles[meta?.category ?? "text"];

  return (
    <Link
      href={`/${locale}/tools/${slug}`}
      className={`group flex h-full rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${styles.ring} ${
        compact ? "flex-row items-center gap-4 p-4" : "flex-col p-5"
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl text-sm font-bold ${styles.bg} ${styles.text} ${
          compact ? "h-11 w-11" : "mb-4 h-12 w-12"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        {!compact ? (
          <span className="mb-2 inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            {categoryLabel}
          </span>
        ) : null}
        <h3
          className={`font-semibold text-slate-900 group-hover:text-blue-700 ${
            compact ? "text-base" : "mt-1 text-lg"
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-sm leading-relaxed text-slate-600 ${
            compact ? "mt-0.5 line-clamp-1" : "mt-2 line-clamp-2 flex-1"
          }`}
        >
          {description}
        </p>
        {!compact ? (
          <span className="mt-4 inline-block text-sm font-medium text-blue-600">
            {cta} →
          </span>
        ) : null}
      </div>
    </Link>
  );
}
