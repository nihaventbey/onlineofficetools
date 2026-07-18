import Link from "next/link";
import type { CmsToolCard } from "@/lib/cms";
import type { Dictionary, Locale } from "@/lib/i18n";
import ToolCard from "@/components/tools/ToolCard";

type ToolPageShellProps = {
  locale: Locale;
  dict: Dictionary;
  title: string;
  description: string;
  categoryLabel: string;
  related: CmsToolCard[];
  children: React.ReactNode;
};

export default function ToolPageShell({
  locale,
  dict,
  title,
  description,
  categoryLabel,
  related,
  children,
}: ToolPageShellProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href={`/${locale}`} className="hover:text-blue-600">
          {dict.common.breadcrumbHome}
        </Link>
        <span>/</span>
        <Link href={`/${locale}#tools`} className="hover:text-blue-600">
          {dict.common.tools}
        </Link>
        <span>/</span>
        <span className="text-slate-800">{title}</span>
      </nav>

      <header className="space-y-3">
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
          {categoryLabel}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-slate-600">
          {description}
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
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
