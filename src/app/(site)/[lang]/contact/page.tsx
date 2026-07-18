import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalPage from "@/components/legal/LegalPage";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

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
      languages: Object.fromEntries(
        locales.map((l) => [l, absoluteUrl(`/${l}/contact`)]),
      ),
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
