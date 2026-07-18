import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedTools } from "@/lib/cms";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ lang: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const tools = await getPublishedTools(locale);

  return (
    <div className="space-y-10 pb-8">
      <section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-violet-50 to-sky-50 p-8 shadow-sm sm:p-10 dark:border-zinc-800 dark:from-zinc-900 dark:via-violet-950/40 dark:to-zinc-900">
        <p className="mb-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-950 dark:text-violet-200">
          {dict.common.siteTagline}
        </p>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
          {dict.home.heroTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-300">
          {dict.home.heroSubtitle}
        </p>
      </section>

      <section id="tools">
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
          {dict.home.toolsHeading}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <article
              key={tool.slug}
              className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-500/40"
            >
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {tool.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {tool.description}
              </p>
              <Link
                href={`/${locale}/${tool.slug}`}
                className="mt-5 inline-flex w-fit items-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition group-hover:bg-violet-600 dark:bg-white dark:text-zinc-900 dark:group-hover:bg-violet-400"
              >
                {dict.home.openTool}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
