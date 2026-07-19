import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ToolPageShell from "@/components/tools/ToolPageShell";
import { getToolForPreview } from "@/lib/cms";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { verifyPreviewToken } from "@/lib/preview-token";
import { getAdminUser } from "@/lib/supabase/requireAdminUser";
import { getToolBySlug } from "@/lib/tools/registry";
import { loadToolComponent } from "@/lib/tools/loaders";

type PageProps = {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Draft preview",
};

export default async function ToolPreviewPage({ params, searchParams }: PageProps) {
  const { lang, slug } = await params;
  const { token } = await searchParams;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const payload = token ? verifyPreviewToken(token) : null;
  const admin = await getAdminUser();

  const authorized =
    Boolean(admin) ||
    (payload !== null && payload.slug === slug);

  if (!authorized) notFound();

  const reg = getToolBySlug(slug);
  if (!reg) notFound();

  const dict = await getDictionary(locale);
  const tool = await getToolForPreview(slug, locale);
  if (!tool) notFound();

  const Component = await loadToolComponent(slug);
  if (!Component) notFound();

  const labels = dict.tools[reg.dictKey];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Taslak önizleme — bu sayfa arama motorlarına kapalıdır ve yalnızca
        imzalı bağlantı veya admin oturumu ile açılır.
      </div>
      <ToolPageShell
        locale={locale}
        dict={dict}
        title={tool.title || labels.title}
        description={tool.description || labels.description}
        category={tool.category}
        categoryLabel={dict.categories[tool.category]}
        related={[]}
        nextStepTools={[]}
        slug={slug}
        accepts={reg.accepts}
        cmsFaqs={tool.faqs}
        cmsHowtoSteps={tool.howtoSteps}
      >
        <Component labels={labels} />
        {tool.content ? (
          <article className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {tool.content}
            </div>
          </article>
        ) : null}
      </ToolPageShell>
    </div>
  );
}
