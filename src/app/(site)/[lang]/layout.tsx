import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ADSENSE_CLIENT, ADSENSE_SLOTS } from "@/lib/adsense";
import {
  getDictionary,
  isLocale,
  locales,
  type Locale,
} from "@/lib/i18n";
import { absoluteUrl, SITE_URL } from "@/lib/site";
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
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, absoluteUrl(`/${locale}`)]),
  );

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
    },
  };
}

export default async function SiteLayout({ children, params }: LayoutProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <Script
          id="adsense-init"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <Header locale={locale} dict={dict} />
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <AdSlot
            slot={ADSENSE_SLOTS.horizontalTop}
            format="horizontal"
            className="mb-4"
          />
        </div>
        <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-2 lg:grid-cols-[minmax(0,1fr)_300px] sm:px-6">
          <main className="min-w-0">{children}</main>
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <AdSlot
                slot={ADSENSE_SLOTS.verticalSidebar}
                format="vertical"
                className="ad-slot-vertical"
              />
            </div>
          </aside>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
          <AdSlot
            slot={ADSENSE_SLOTS.horizontalBottom}
            format="horizontal"
            className="mt-2 lg:hidden"
          />
          <AdSlot
            slot={ADSENSE_SLOTS.horizontalBottom}
            format="horizontal"
            className="mt-2 hidden lg:block"
          />
        </div>
        <Footer dict={dict} />
      </body>
    </html>
  );
}
