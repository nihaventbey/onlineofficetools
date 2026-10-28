import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import AdsLayout from "@/components/AdsLayout";
import ConsentBanner from "@/components/ConsentBanner";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Header from "@/components/Header";
import {
  getAdSenseConfig,
  getSiteSettings,
  publicMediaUrl,
} from "@/lib/cms";
import { CONSENT_STORAGE_KEY } from "@/lib/adsense";
import {
  getDictionary,
  isLocale,
  locales,
  type Locale,
} from "@/lib/i18n";
import { absoluteUrl, languageAlternates, SITE_URL } from "@/lib/site";
import "../../globals.css";

/** Must run synchronously before AdSense/gtag so Consent Mode v2 is detected. */
const CONSENT_DEFAULT_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
try {
  if (localStorage.getItem('${CONSENT_STORAGE_KEY}') === 'accepted') {
    gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  }
} catch (e) {}
`;

export const dynamicParams = false;
// Fully static until deploy or on-demand revalidatePath (admin save).
export const revalidate = false;
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
      // Home canonical; child routes override with their own path.
      canonical: absoluteUrl(`/${lang}`),
      languages,
    },
    // Google Favicon crawler requires a multiple of 48px (48x48, 96x96, 192x192) and root /favicon.ico
    icons: {
      icon: [
        { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: "kb_2Cv5vK2rMofTDNUmljAfEcI8IK1S7pGsu8R62Gs4",
    },
    // Do not set openGraph.url here — it would leak the homepage URL onto
    // every child page that does not override openGraph.
    openGraph: {
      type: "website",
      locale: lang,
      siteName,
      title: dict.home.title,
      description,
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.home.title,
      description,
      images: ["/og-default.png"],
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
  // Always emit the publisher script when the client ID is valid so Google can
  // verify the site, even if ad placements are temporarily disabled in CMS.
  const adsenseClientId = adConfig.clientId;
  const showAdSenseScript = /^ca-pub-\d{10,}$/.test(adsenseClientId);

  return (
    <html
      lang={locale}
      className="h-full antialiased"
    >
      <head>
        {/* Favicon for Googlebot-Image, Google Search and desktop/mobile browsers */}
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* AI Agent & API Discovery Links (RFC 8288 / RFC 9727 / SEP-1649 / ARD) */}
        <link rel="api-catalog" href="/.well-known/api-catalog" />
        <link rel="service-desc" href="/.well-known/ai-catalog.json" />
        <link rel="agent-skills" href="/.well-known/agent-skills/index.json" />
        <link rel="mcp-server-card" href="/.well-known/mcp/server-card.json" />

        {/* Inline + first in <head>: Next.js beforeInteractive is unreliable
            outside app/layout.tsx and was loading AFTER AdSense. */}
        <script
          id="google-consent-default"
          dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }}
        />
        {showAdSenseScript ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
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
        <Header
          locale={locale}
          dict={dict}
          logoUrl={logoUrl}
          siteName={siteSettings.siteName || dict.common.siteName}
          siteTagline={siteSettings.siteTagline || dict.common.siteTagline}
        />
        <AdsLayout adConfig={adConfig} adLabel={dict.common.advertisement}>
          {children}
        </AdsLayout>
        <Footer locale={locale} dict={dict} />
        <GoogleAnalytics />
        <ConsentBanner
          message={dict.common.consentMessage}
          acceptLabel={dict.common.consentAccept}
          declineLabel={dict.common.consentDecline}
        />
      </body>
    </html>
  );
}
