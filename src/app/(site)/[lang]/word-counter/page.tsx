import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WordCounter from "@/components/tools/WordCounter";
import { getPublishedTool } from "@/lib/cms";
import {
  getDictionary,
  isLocale,
  locales,
  type Locale,
} from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

type PageProps = {
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const cms = await getPublishedTool("word-counter", lang);
  const dict = await getDictionary(lang);
  const title = cms?.seoTitle ?? dict.tools.wordCounter.metaTitle;
  const description =
    cms?.seoDescription ?? dict.tools.wordCounter.metaDescription;

  const languages = Object.fromEntries(
    locales.map((locale) => [
      locale,
      absoluteUrl(`/${locale}/word-counter`),
    ]),
  );

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/${lang}/word-counter`),
      languages,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/${lang}/word-counter`),
    },
  };
}

export default async function WordCounterPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const cms = await getPublishedTool("word-counter", locale);
  const labels = dict.tools.wordCounter;

  return (
    <div className="space-y-6 pb-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {cms?.title ?? labels.title}
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-300">
          {cms?.description ?? labels.description}
        </p>
      </header>

      <WordCounter labels={labels} />

      {cms?.content ? (
        <article className="prose prose-zinc max-w-none rounded-2xl border border-zinc-200 bg-white p-6 dark:prose-invert dark:border-zinc-800 dark:bg-zinc-900">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {cms.content}
          </div>
        </article>
      ) : null}
    </div>
  );
}
