"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

/**
 * Google Analytics 4 (gtag). Loads only after the site consent banner
 * is accepted — same gate as advertising preferences.
 */
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(hasAnalyticsConsent());

    function onConsent(event: Event) {
      const detail = (event as CustomEvent<ConsentChangeDetail>).detail;
      setAllowed(Boolean(detail?.accepted));
    }

    window.addEventListener(CONSENT_CHANGE_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onConsent);
  }, []);

  useEffect(() => {
    if (!allowed || typeof window.gtag !== "function") return;
    const path =
      pathname +
      (typeof window !== "undefined" ? window.location.search : "");
    window.gtag("config", GA_ID, { page_path: path });
  }, [pathname, allowed]);

  if (!allowed || !GA_ID.startsWith("G-")) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
