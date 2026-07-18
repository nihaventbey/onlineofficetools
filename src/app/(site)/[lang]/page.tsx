import Link from "next/link";
import { notFound } from "next/navigation";
import ToolSearch from "@/components/tools/ToolSearch";
import ToolGrid from "@/components/tools/ToolGrid";
import { getPublishedTools } from "@/lib/cms";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { toolCategories } from "@/lib/tools/categories";

type PageProps = {
  params: Promise<{ lang: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const tools = await getPublishedTools(locale);
  const popular = tools.slice(0, 3);

  return (
    <div className="space-y-12 pb-10">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-violet-50 to-sky-50 p-8 shadow-sm sm:p-12 dark:border-zinc-800 dark:from-zinc-900 dark:via-violet-950/40 dark:to-zinc-900">
        <p className="mb-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-950 dark:text-violet-200">
          {dict.common.siteTagline}
        </p>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
          {dict.home.heroTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-300">
          {dict.home.heroSubtitle}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${locale}#tools`}
            className="inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
          >
            {dict.common.exploreCta}
          </Link>
          <Link
            href={`/${locale}/about`}
            className="inline-flex rounded-xl border border-zinc-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {dict.common.about}
          </Link>
        </div>
        <ul className="mt-8 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-300">
          <li className="rounded-full bg-white/70 px-3 py-1 dark:bg-zinc-900/70">{dict.common.trustPrivate}</li>
          <li className="rounded-full bg-white/70 px-3 py-1 dark:bg-zinc-900/70">{dict.common.trustFast}</li>
          <li className="rounded-full bg-white/70 px-3 py-1 dark:bg-zinc-900/70">{dict.common.trustFree}</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
          {dict.home.popularHeading}
        </h2>
        <ToolGrid locale={locale} tools={popular} dict={dict} />
      </section>

      <section id="tools" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            {dict.home.toolsHeading}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">{dict.home.categoryHeading}</p>
        </div>
        <ToolSearch locale={locale} tools={tools} dict={dict} />
      </section>

      {toolCategories.map((cat) => {
        const group = tools.filter((t) => t.category === cat);
        if (!group.length) return null;
        return (
          <section
            key={cat}
            id={`category-${cat}`}
            className="scroll-mt-24 space-y-4"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {dict.categories[cat]}
            </h2>
            <ToolGrid locale={locale} tools={group} dict={dict} />
          </section>
        );
      })}
    </div>
  );
}
