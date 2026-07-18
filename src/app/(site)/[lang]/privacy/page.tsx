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
    title: dict.legal.privacy.title,
    description: dict.legal.privacy.metaDescription,
    alternates: {
      canonical: absoluteUrl(`/${lang}/privacy`),
      languages: languageAlternates("/privacy"),
    },
  };
}

export default async function PrivacyPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return (
    <LegalPage
      title={dict.legal.privacy.title}
      body={dict.legal.privacy.body}
      siteName={dict.common.siteName}
    />
  );
}
