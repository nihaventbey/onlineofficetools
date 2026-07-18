import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalPage from "@/components/legal/LegalPage";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { absoluteUrl, languageAlternates } from "@/lib/site";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.legal.terms.title,
    description: dict.legal.terms.metaDescription,
    alternates: {
      canonical: absoluteUrl(`/${lang}/terms`),
      languages: languageAlternates("/terms"),
    },
  };
}

export default async function TermsPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return (
    <LegalPage
      title={dict.legal.terms.title}
      body={dict.legal.terms.body}
      siteName={dict.common.siteName}
    />
  );
}
