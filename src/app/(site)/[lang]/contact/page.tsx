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
    title: dict.legal.contact.title,
    description: dict.legal.contact.metaDescription,
    alternates: {
      canonical: absoluteUrl(`/${lang}/contact`),
      languages: languageAlternates("/contact"),
    },
  };
}

export default async function ContactPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return (
    <LegalPage
      title={dict.legal.contact.title}
      body={dict.legal.contact.body}
      siteName={dict.common.siteName}
      contactEmail={{
        label: dict.legal.contact.emailLabel,
        email: dict.legal.contact.email,
      }}
    />
  );
}
