"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  CONSENT_CHANGE_EVENT,
  CONSENT_STORAGE_KEY,
  isValidClient,
  type ConsentChangeDetail,
} from "@/lib/adsense";

type AdSenseLoaderProps = {
  enabled: boolean;
  clientId: string;
};

/**
 * Injects the adsbygoogle.js script only when AdSense is enabled, the
 * client id is valid, AND the visitor has accepted the consent banner.
 * Listens for the `oot-consent-change` event so accepting consent loads
 * the script without a page reload.
 */
export default function AdSenseLoader({ enabled, clientId }: AdSenseLoaderProps) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    try {
      setConsented(localStorage.getItem(CONSENT_STORAGE_KEY) === "accepted");
    } catch {
      setConsented(false);
    }

    function onConsentChange(event: Event) {
      const detail = (event as CustomEvent<ConsentChangeDetail>).detail;
      setConsented(Boolean(detail?.accepted));
    }

    window.addEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
  }, []);

  if (!enabled || !consented || !isValidClient(clientId)) return null;

  return (
    <Script
      id="adsense-init"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
