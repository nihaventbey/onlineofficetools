import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ToolPageShell from "@/components/tools/ToolPageShell";
import ToolFeedback from "@/components/tools/ToolFeedback";
import { getPublishedSlugs, getPublishedTool, getPublishedTools } from "@/lib/cms";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { absoluteUrl, languageAlternates } from "@/lib/site";
import { getToolBySlug } from "@/lib/tools/registry";
import { loadToolComponent } from "@/lib/tools/loaders";

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

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/${locale}/tools/${slug}`),
      languages: languageAlternates(`/tools/${slug}`),
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

  const Component = await loadToolComponent(slug);
  if (!Component) notFound();

  const labels = dict.tools[reg.dictKey];
  const all = await getPublishedTools(locale);
  const same = all.filter((t) => t.slug !== slug && t.category === tool.category);
  const cross = all.filter((t) => t.slug !== slug && t.category !== tool.category);
  const related = [...same.slice(0, 2), ...cross.slice(0, 1)];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title || labels.title,
    description: tool.description || labels.description,
    url: absoluteUrl(`/${locale}/tools/${slug}`),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    inLanguage: locale,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: dict.common.home,
        item: absoluteUrl(`/${locale}`),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: dict.categories[tool.category],
        item: absoluteUrl(`/${locale}/categories/${tool.category}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.title || labels.title,
        item: absoluteUrl(`/${locale}/tools/${slug}`),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ToolPageShell
        locale={locale}
        dict={dict}
        title={tool.title || labels.title}
        description={tool.description || labels.description}
        category={tool.category}
        categoryLabel={dict.categories[tool.category]}
        related={related}
        slug={slug}
      >
        <Component labels={labels} />
        <ToolFeedback dict={dict} slug={slug} />
        {tool.content ? (
          <article className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {tool.content}
            </div>
          </article>
        ) : null}
      </ToolPageShell>
    </>
  );
}
