import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToolGrid from "@/components/tools/ToolGrid";
import { getPublishedTools } from "@/lib/cms";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { absoluteUrl, languageAlternates } from "@/lib/site";
import {
  categoryStyles,
  isToolCategory,
  toolCategories,
  type ToolCategory,
} from "@/lib/tools/categories";
import { featuredTools, toolsByCategory } from "@/lib/tools/registry";

type PageProps = {
  params: Promise<{ lang: string; category: string }>;
};

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    toolCategories.map((category) => ({ lang, category })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang, category } = await params;
  if (!isLocale(lang) || !isToolCategory(category)) return {};
  const dict = await getDictionary(lang);
  const label = dict.categories[category];
  const description = dict.common.categoryDescription.replace(
    "{category}",
    label,
  );
  return {
    title: label,
    description,
    alternates: {
      canonical: absoluteUrl(`/${lang}/categories/${category}`),
      languages: languageAlternates(`/categories/${category}`),
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { lang, category } = await params;
  if (!isLocale(lang) || !isToolCategory(category)) notFound();

  const locale = lang as Locale;
  const cat = category as ToolCategory;
  const dict = await getDictionary(locale);
  const tools = await getPublishedTools(locale);
  const group = tools.filter((t) => t.category === cat);
  const style = categoryStyles[cat];
  const label = dict.categories[cat];
  const featured = featuredTools()
    .filter((t) => t.category === cat)
    .map((m) => group.find((g) => g.slug === m.slug))
    .filter(Boolean);

  const countLabel = dict.common.categoryTools.replace(
    "{count}",
    String(group.length || toolsByCategory(cat).length),
  );

  return (
    <div className="space-y-8 pb-12">
      <header
        className={`rounded-3xl border ${style.border} ${style.soft} px-6 py-10 sm:px-10`}
      >
        <p className={`text-xs font-bold uppercase tracking-wide ${style.text}`}>
          {dict.common.categories}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {label}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          {dict.common.categoryDescription.replace("{category}", label)}
        </p>
        <p className={`mt-4 text-sm font-semibold ${style.text}`}>{countLabel}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {toolCategories.map((c) => (
            <Link
              key={c}
              href={`/${locale}/categories/${c}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                c === cat
                  ? `${categoryStyles[c].bg} ${categoryStyles[c].text}`
                  : "bg-white text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              {dict.categories[c]}
            </Link>
          ))}
        </div>
      </header>

      {featured.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {dict.home.popularHeading}
          </h2>
          <ToolGrid
            locale={locale}
            tools={featured as typeof group}
            dict={dict}
            compact
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          {dict.common.allTools}
        </h2>
        <ToolGrid locale={locale} tools={group} dict={dict} />
      </section>
    </div>
  );
}
