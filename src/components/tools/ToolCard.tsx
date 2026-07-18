import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { getToolBySlug } from "@/lib/tools/registry";

type ToolCardProps = {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  categoryLabel: string;
  cta: string;
};

export default function ToolCard({
  locale,
  slug,
  title,
  description,
  categoryLabel,
  cta,
}: ToolCardProps) {
  const meta = getToolBySlug(slug);
  const icon = meta?.icon ?? "•";

  return (
    <Link
      href={`/${locale}/tools/${slug}`}
      className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-500/40"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-200">
          {icon}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {categoryLabel}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        {description}
      </p>
      <span className="mt-5 text-sm font-medium text-violet-700 dark:text-violet-300">
        {cta} →
      </span>
    </Link>
  );
}
