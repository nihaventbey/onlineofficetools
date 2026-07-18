import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ToolPageShell from "@/components/tools/ToolPageShell";
import { getPublishedSlugs, getPublishedTool, getPublishedTools } from "@/lib/cms";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import { getToolBySlug } from "@/lib/tools/registry";

type PageProps = {
  params: Promise<{ lang: string; slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return locales.flatMap((lang) =>
    slugs.map((slug) => ({ lang, slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const tool = await getPublishedTool(slug, locale);
  const reg = getToolBySlug(slug);
  const labels = reg ? dict.tools[reg.dictKey] : null;

  const title = tool?.seoTitle || labels?.metaTitle || slug;
  const description =
    tool?.seoDescription || labels?.metaDescription || labels?.description || "";

  const languages = Object.fromEntries(
    locales.map((l) => [l, absoluteUrl(`/${l}/tools/${slug}`)]),
  );

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/${locale}/tools/${slug}`),
      languages,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/${locale}/tools/${slug}`),
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const reg = getToolBySlug(slug);
  if (!reg) notFound();

  const dict = await getDictionary(locale);
  const tool = await getPublishedTool(slug, locale);
  if (!tool) notFound();

  const labels = dict.tools[reg.dictKey];
  const all = await getPublishedTools(locale);
  const related = all
    .filter((t) => t.slug !== slug && t.category === tool.category)
    .slice(0, 3);

  const Component = reg.Component;

  return (
    <ToolPageShell
      locale={locale}
      dict={dict}
      title={tool.title || labels.title}
      description={tool.description || labels.description}
      categoryLabel={dict.categories[tool.category]}
      related={related}
    >
      <Component labels={labels} />
      {tool.content ? (
        <article className="prose prose-zinc max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {tool.content}
          </div>
        </article>
      ) : null}
    </ToolPageShell>
  );
}
