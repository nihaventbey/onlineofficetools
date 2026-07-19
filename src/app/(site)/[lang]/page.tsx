import Link from "next/link";
import { notFound } from "next/navigation";
import ToolSearch from "@/components/tools/ToolSearch";
import ToolGrid from "@/components/tools/ToolGrid";
import RecentTools from "@/components/tools/RecentTools";
import { getPublishedTools } from "@/lib/cms";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import { categoryStyles, visibleCategories } from "@/lib/tools/categories";
import { featuredTools } from "@/lib/tools/registry";

type PageProps = {
  params: Promise<{ lang: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const tools = await getPublishedTools(locale);
  const featuredSlugs = new Set(featuredTools().map((t) => t.slug));
  const popular = [
    ...tools.filter((t) => featuredSlugs.has(t.slug)),
    ...tools,
  ]
    .filter(
      (t, i, arr) => arr.findIndex((x) => x.slug === t.slug) === i,
    )
    .slice(0, 4);

  const toolsCountLabel = dict.home.toolsCount.replace(
    "{count}",
    String(tools.length),
  );
  const categories = visibleCategories(locale);
  const ebysTools = tools.filter((t) => t.category === "ebys");

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: dict.common.siteName,
    url: absoluteUrl(`/${locale}`),
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl(`/${locale}`)}#tools`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="space-y-10 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <section className="relative overflow-hidden rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 px-5 py-7 shadow-sm sm:px-10 sm:py-10 lg:px-12 lg:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-sky-300/25 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:mb-4">
            <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate">{dict.common.siteTagline}</span>
            </span>
            <span className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              {toolsCountLabel}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl lg:leading-[1.1]">
            {dict.home.heroTitle}{" "}
            <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
              {dict.home.heroHighlight}
            </span>
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {dict.home.heroSubtitle}
          </p>

          <div className="mx-auto mt-5 flex max-w-xl flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}#tools`}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
            >
              {dict.common.exploreCta}
            </Link>
          </div>

          <ul className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {[dict.common.trustPrivate, dict.common.trustFree].map((item) => (
              <li
                key={item}
                className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/80"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <nav
        aria-label={dict.common.categories}
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {categories.map((cat) => {
          const style = categoryStyles[cat];
          return (
            <Link
              key={cat}
              href={`/${locale}/categories/${cat}`}
              className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition hover:scale-[1.02] ${style.bg} ${style.text}`}
            >
              {dict.categories[cat]}
            </Link>
          );
        })}
      </nav>

      <RecentTools locale={locale} dict={dict} />

      {locale === "tr" && ebysTools.length ? (
        <section id="belgenet" className="scroll-mt-24 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Belgenet hazırlık araçları
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Arz/rica, SDP, DETSİS ve Belgenet&apos;e yapıştırılacak HTML — dosyalar
                cihazınızda kalır.
              </p>
            </div>
            <Link
              href={`/${locale}/categories/ebys`}
              className="text-sm font-semibold text-amber-700"
            >
              {dict.common.openTool} →
            </Link>
          </div>
          <ToolGrid locale={locale} tools={ebysTools} dict={dict} />
        </section>
      ) : null}

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

      {categories.map((cat) => {
        const group = tools.filter((t) => t.category === cat);
        if (!group.length) return null;
        const style = categoryStyles[cat];
        return (
          <section
            key={cat}
            id={`category-${cat}`}
            className="scroll-mt-24 space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
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
              <Link
                href={`/${locale}/categories/${cat}`}
                className={`text-sm font-semibold ${style.text}`}
              >
                {dict.common.openTool} →
              </Link>
            </div>
            <ToolGrid locale={locale} tools={group.slice(0, 8)} dict={dict} />
          </section>
        );
      })}
    </div>
  );
}
