import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { notFound } from "next/navigation";
import AdsLayout from "@/components/AdsLayout";
import ConsentBanner from "@/components/ConsentBanner";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ADSENSE_CLIENT, isAdSenseConfigured } from "@/lib/adsense";
import { getSiteLogoUrl } from "@/lib/cms";
import {
  getDictionary,
  isLocale,
  locales,
  type Locale,
} from "@/lib/i18n";
import { absoluteUrl, languageAlternates, SITE_URL } from "@/lib/site";
import "../../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamicParams = false;
// Re-generate periodically so CMS changes (e.g. an uploaded logo) show up.
export const revalidate = 3600;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const dict = await getDictionary(lang);
  const languages = languageAlternates("/");

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: dict.home.title,
      template: `%s | ${dict.common.siteName}`,
    },
    description: dict.home.description,
    alternates: {
      canonical: absoluteUrl(`/${lang}`),
      languages,
    },
    openGraph: {
      type: "website",
      locale: lang,
      url: absoluteUrl(`/${lang}`),
      siteName: dict.common.siteName,
      title: dict.home.title,
      description: dict.home.description,
      images: [{ url: absoluteUrl("/og-default.png"), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.home.title,
      description: dict.home.description,
      images: [absoluteUrl("/og-default.png")],
    },
    manifest: "/manifest.webmanifest",
  };
}

export default async function SiteLayout({ children, params }: LayoutProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const adsEnabled = isAdSenseConfigured();
  const logoUrl = await getSiteLogoUrl();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        {adsEnabled ? (
          <Script
            id="adsense-init"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        ) : null}
        <Header locale={locale} dict={dict} logoUrl={logoUrl} />
        <AdsLayout>{children}</AdsLayout>
        <Footer locale={locale} dict={dict} />
        <ConsentBanner
          message={dict.common.consentMessage}
          acceptLabel={dict.common.consentAccept}
          declineLabel={dict.common.consentDecline}
        />
      </body>
    </html>
  );
}
