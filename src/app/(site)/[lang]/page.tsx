import Link from "next/link";
import { notFound } from "next/navigation";
import ToolSearch from "@/components/tools/ToolSearch";
import ToolGrid from "@/components/tools/ToolGrid";
import { getPublishedTools } from "@/lib/cms";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { categoryStyles, toolCategories } from "@/lib/tools/categories";

type PageProps = {
  params: Promise<{ lang: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const tools = await getPublishedTools(locale);
  const popular = tools.slice(0, 4);
  const toolsCountLabel = dict.home.toolsCount.replace(
    "{count}",
    String(tools.length),
  );

  return (
    <div className="space-y-14 pb-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 px-6 py-12 shadow-sm sm:px-12 sm:py-16 lg:px-16 lg:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-1/4 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-indigo-300/15 blur-2xl"
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {dict.common.siteTagline}
            </span>
            <span className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              {toolsCountLabel}
            </span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.08]">
            {dict.home.heroTitle}{" "}
            <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
              {dict.home.heroHighlight}
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {dict.home.heroSubtitle}
          </p>

          <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}#tools`}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
            >
              {dict.common.exploreCta}
            </Link>
            <Link
              href={`/${locale}/tools/pdf-merge`}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 px-6 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-white"
            >
              {dict.categories.pdf} →
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {[
              dict.common.trustPrivate,
              dict.common.trustFast,
              dict.common.trustFree,
            ].map((item) => (
              <li
                key={item}
                className="rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/80 sm:text-sm"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {toolCategories.map((cat) => {
              const style = categoryStyles[cat];
              return (
                <Link
                  key={cat}
                  href={`/${locale}#category-${cat}`}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition hover:scale-[1.02] ${style.bg} ${style.text}`}
                >
                  {dict.categories[cat]}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="tools" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {dict.common.allTools}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{dict.home.categoryHeading}</p>
        </div>
        <ToolSearch locale={locale} tools={tools} dict={dict} heroMode />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          {dict.home.popularHeading}
        </h2>
        <ToolGrid locale={locale} tools={popular} dict={dict} compact />
      </section>

      {toolCategories.map((cat) => {
        const group = tools.filter((t) => t.category === cat);
        if (!group.length) return null;
        const style = categoryStyles[cat];
        return (
          <section
            key={cat}
            id={`category-${cat}`}
            className="scroll-mt-24 space-y-4"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${style.bg} ${style.text}`}
              >
                {cat.slice(0, 1).toUpperCase()}
              </span>
              <h2 className="text-xl font-semibold text-slate-900">
                {dict.categories[cat]}
              </h2>
            </div>
            <ToolGrid locale={locale} tools={group} dict={dict} />
          </section>
        );
      })}
    </div>
  );
}
