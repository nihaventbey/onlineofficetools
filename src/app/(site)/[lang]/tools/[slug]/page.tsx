import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ToolPageShell from "@/components/tools/ToolPageShell";
import ToolFeedback from "@/components/tools/ToolFeedback";
import { buildFaqHowToJsonLd } from "@/components/tools/ToolFaqHowTo";
import {
  getAdSenseConfig,
  getPublishedSlugs,
  getPublishedTool,
  getPublishedTools,
} from "@/lib/cms";
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
      type: "website",
      locale,
      url: absoluteUrl(`/${locale}/tools/${slug}`),
      siteName: dict.common.siteName,
      title,
      description,
      images: [
        {
          url: absoluteUrl(`/${locale}/tools/${slug}/opengraph-image`),
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(`/${locale}/tools/${slug}/opengraph-image`)],
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

  const nextStepTools = (reg.nextSteps ?? [])
    .map((s) => all.find((t) => t.slug === s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .slice(0, 2);

  const pageTitle = tool.title || labels.title;
  const pageDescription = tool.description || labels.description;
  const pageUrl = absoluteUrl(`/${locale}/tools/${slug}`);
  const formats = (reg.accepts ?? []).join(", ") || "—";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: pageTitle,
    description: pageDescription,
    url: pageUrl,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    inLanguage: locale,
    featureList: reg.keywords,
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
        name: pageTitle,
        item: pageUrl,
      },
    ],
  };

  const { howToLd, faqLd } = buildFaqHowToJsonLd({
    dict,
    title: pageTitle,
    formats,
    url: pageUrl,
    cmsFaqs: tool.faqs,
    cmsHowtoSteps: tool.howtoSteps,
  });

  const adConfig = await getAdSenseConfig();

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <ToolPageShell
        locale={locale}
        dict={dict}
        title={pageTitle}
        description={pageDescription}
        category={tool.category}
        categoryLabel={dict.categories[tool.category]}
        related={related}
        nextStepTools={nextStepTools}
        slug={slug}
        accepts={reg.accepts}
        cmsFaqs={tool.faqs}
        cmsHowtoSteps={tool.howtoSteps}
        adConfig={adConfig}
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
