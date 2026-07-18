import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { categoryStyles } from "@/lib/tools/categories";
import { getToolBySlug, type ToolBadge } from "@/lib/tools/registry";

type ToolCardProps = {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  categoryLabel: string;
  cta: string;
  compact?: boolean;
  coverUrl?: string | null;
  badgeLabels?: { new: string; popular: string; beta: string };
};

function Badge({
  badge,
  labels,
}: {
  badge: ToolBadge;
  labels?: ToolCardProps["badgeLabels"];
}) {
  if (!badge || !labels) return null;
  const text =
    badge === "new"
      ? labels.new
      : badge === "popular"
        ? labels.popular
        : labels.beta;
  const cls =
    badge === "new"
      ? "bg-sky-600 text-white"
      : badge === "popular"
        ? "bg-amber-500 text-white"
        : "bg-violet-600 text-white";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>
      {text}
    </span>
  );
}

export default function ToolCard({
  locale,
  slug,
  title,
  description,
  categoryLabel,
  cta,
  compact = false,
  coverUrl,
  badgeLabels,
}: ToolCardProps) {
  const meta = getToolBySlug(slug);
  const icon = meta?.icon ?? "•";
  const styles = categoryStyles[meta?.category ?? "text"];
  const accepts = meta?.accepts?.slice(0, 3).join(", ");

  return (
    <Link
      href={`/${locale}/tools/${slug}`}
      className={`group relative flex h-full overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${styles.border} ${styles.ring} ${
        compact ? "flex-row items-center gap-4 p-4" : "flex-col"
      }`}
    >
      {!compact ? (
        <div className={`h-1.5 w-full ${styles.bg}`} aria-hidden />
      ) : null}
      <div
        className={`flex min-w-0 flex-1 ${
          compact ? "flex-row items-center gap-4" : "flex-col p-5 pt-4"
        }`}
      >
        {coverUrl && !compact ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="mb-3 h-28 w-full rounded-xl object-cover"
          />
        ) : (
          <span
            className={`flex shrink-0 items-center justify-center rounded-xl text-sm font-bold ${styles.bg} ${styles.text} ${
              compact ? "h-11 w-11" : "mb-3 h-12 w-12"
            }`}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {!compact ? (
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles.bg} ${styles.text}`}
              >
                {categoryLabel}
              </span>
            ) : null}
            <Badge badge={meta?.badge ?? null} labels={badgeLabels} />
          </div>
          <h3
            className={`font-semibold text-slate-900 group-hover:text-blue-700 ${
              compact ? "text-base" : "text-lg"
            }`}
          >
            {title}
          </h3>
          <p
            className={`text-sm leading-relaxed text-slate-600 ${
              compact ? "mt-0.5 line-clamp-1" : "mt-2 line-clamp-2"
            }`}
          >
            {description}
          </p>
          {!compact && accepts ? (
            <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {accepts}
            </p>
          ) : null}
          {!compact ? (
            <span className={`mt-4 inline-block text-sm font-medium ${styles.text}`}>
              {cta} →
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
