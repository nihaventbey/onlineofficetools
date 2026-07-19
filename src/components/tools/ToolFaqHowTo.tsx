type ToolPageDict = {
  howToTitle: string;
  howToStep1: string;
  howToStep2: string;
  howToStep3: string;
  faqTitle: string;
  faq1q: string;
  faq1a: string;
  faq2q: string;
  faq2a: string;
  faq3q: string;
  faq3a: string;
  faq4q: string;
  faq4a: string;
};

type DictLike = {
  toolPage: ToolPageDict;
};

export type CmsFaq = { q: string; a: string };

function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

function resolveContent({
  dict,
  title,
  formats,
  cmsFaqs,
  cmsHowtoSteps,
}: {
  dict: DictLike;
  title: string;
  formats: string;
  cmsFaqs?: CmsFaq[] | null;
  cmsHowtoSteps?: string[] | null;
}) {
  const tp = dict.toolPage;
  const vars = { tool: title, formats };

  const steps =
    cmsHowtoSteps && cmsHowtoSteps.length > 0
      ? cmsHowtoSteps
      : [
          fill(tp.howToStep1, vars),
          fill(tp.howToStep2, vars),
          fill(tp.howToStep3, vars),
        ];

  const faqs =
    cmsFaqs && cmsFaqs.length > 0
      ? cmsFaqs
      : [
          { q: fill(tp.faq1q, vars), a: fill(tp.faq1a, vars) },
          { q: fill(tp.faq2q, vars), a: fill(tp.faq2a, vars) },
          { q: fill(tp.faq3q, vars), a: fill(tp.faq3a, vars) },
          { q: fill(tp.faq4q, vars), a: fill(tp.faq4a, vars) },
        ];

  return {
    howToTitle: fill(tp.howToTitle, vars),
    faqTitle: tp.faqTitle,
    steps,
    faqs,
  };
}

export default function ToolFaqHowTo({
  dict,
  title,
  formats,
  cmsFaqs,
  cmsHowtoSteps,
}: {
  dict: DictLike;
  title: string;
  formats: string;
  cmsFaqs?: CmsFaq[] | null;
  cmsHowtoSteps?: string[] | null;
}) {
  const { howToTitle, faqTitle, steps, faqs } = resolveContent({
    dict,
    title,
    formats,
    cmsFaqs,
    cmsHowtoSteps,
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">{howToTitle}</h2>
        <ol className="mt-4 space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-600">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">{faqTitle}</h2>
        <div className="mt-4 space-y-2">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 open:bg-white open:shadow-sm"
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-800 marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  {faq.q}
                  <span className="text-slate-400 transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

export function buildFaqHowToJsonLd({
  dict,
  title,
  formats,
  url,
  cmsFaqs,
  cmsHowtoSteps,
}: {
  dict: DictLike;
  title: string;
  formats: string;
  url: string;
  cmsFaqs?: CmsFaq[] | null;
  cmsHowtoSteps?: string[] | null;
}) {
  const { howToTitle, steps, faqs } = resolveContent({
    dict,
    title,
    formats,
    cmsFaqs,
    cmsHowtoSteps,
  });

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howToTitle,
    description: title,
    url,
    step: steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: text,
      text,
    })),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return { howToLd, faqLd };
}
