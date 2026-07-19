import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import AdsLayout from "@/components/AdsLayout";
import ConsentBanner from "@/components/ConsentBanner";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  getAdSenseConfig,
  getSiteSettings,
  publicMediaUrl,
} from "@/lib/cms";
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
// CMS branding (logo) and settings should refresh reasonably quickly.
export const revalidate = 60;
export const viewport: Viewport = {
  themeColor: "#2563eb",
};

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
  const siteSettings = await getSiteSettings(lang);
  const faviconUrl = publicMediaUrl(siteSettings.faviconPath);
  const languages = languageAlternates("/");
  const siteName = siteSettings.siteName || dict.common.siteName;
  const description = dict.home.description;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: dict.home.title,
      template: `%s | ${siteName}`,
    },
    description,
    alternates: {
      canonical: absoluteUrl(`/${lang}`),
      languages,
    },
    icons: faviconUrl
      ? { icon: [{ url: faviconUrl }] }
      : {
          icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
          apple: [{ url: "/icon-192.png", sizes: "180x180", type: "image/png" }],
        },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: lang,
      url: absoluteUrl(`/${lang}`),
      siteName,
      title: dict.home.title,
      description,
      images: [{ url: absoluteUrl("/og-default.png"), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.home.title,
      description,
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
  const [adConfig, siteSettings] = await Promise.all([
    getAdSenseConfig(),
    getSiteSettings(locale),
  ]);
  const logoUrl = publicMediaUrl(siteSettings.logoPath);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {adConfig.enabled ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.clientId}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        {siteSettings.maintenanceMessage ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
            {siteSettings.maintenanceMessage}
          </div>
        ) : null}
        <Header locale={locale} dict={dict} logoUrl={logoUrl} />
        <AdsLayout adConfig={adConfig} adLabel={dict.common.advertisement}>
          {children}
        </AdsLayout>
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
