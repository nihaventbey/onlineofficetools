"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  CONSENT_CHANGE_EVENT,
  CONSENT_STORAGE_KEY,
  type ConsentChangeDetail,
} from "@/lib/adsense";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-GR04WTDMKB";

function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY) === "accepted";
  } catch {
    return false;
  }
}

function applyConsent(accepted: boolean) {
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    analytics_storage: accepted ? "granted" : "denied",
    ad_storage: accepted ? "granted" : "denied",
    ad_user_data: accepted ? "granted" : "denied",
    ad_personalization: accepted ? "granted" : "denied",
  });
}

function trackPageView(pathname: string) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: pathname + window.location.search,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/**
 * Loads gtag on every page so Google Tag Coverage sees the site as tagged.
 * Storage stays denied until the consent banner grants it (Consent Mode v2).
 * Initial page_view comes from gtag config; client navigations send another.
 */
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const isFirstPath = useRef(true);

  useEffect(() => {
    applyConsent(hasAnalyticsConsent());

    function onConsent(event: Event) {
      const detail = (event as CustomEvent<ConsentChangeDetail>).detail;
      const ok = Boolean(detail?.accepted);
      applyConsent(ok);
      if (ok) {
        trackPageView(window.location.pathname);
      }
    }

    window.addEventListener(CONSENT_CHANGE_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onConsent);
  }, []);

  useEffect(() => {
    if (isFirstPath.current) {
      isFirstPath.current = false;
      return;
    }
    trackPageView(pathname);
  }, [pathname]);

  if (!GA_ID.startsWith("G-")) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){dataLayer.push(arguments);};
          window.gtag('js', new Date());
          window.gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
