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

  return (
    <div className="space-y-14 pb-12">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10 sm:py-14">
        <p className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
          {dict.common.siteTagline}
        </p>
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {dict.home.heroTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          {dict.home.heroSubtitle}
        </p>
        <ul className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
          <li className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
            {dict.common.trustPrivate}
          </li>
          <li className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
            {dict.common.trustFast}
          </li>
          <li className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
            {dict.common.trustFree}
          </li>
        </ul>
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
