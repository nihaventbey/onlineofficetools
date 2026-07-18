"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ADSENSE_CLIENT, isAdSlotConfigured } from "@/lib/adsense";

type AdSlotProps = {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({
  slot,
  format = "auto",
  className = "",
}: AdSlotProps) {
  const pathname = usePathname();
  const pushed = useRef(false);
  const enabled = isAdSlotConfigured(slot);

  useEffect(() => {
    pushed.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!enabled || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ignore AdSense race conditions on client navigations.
    }
  }, [pathname, slot, enabled]);

  if (!enabled) return null;

  return (
    <div
      key={`${pathname}-${slot}`}
      className={`ad-slot overflow-hidden ${className}`}
      aria-label="Advertisement"
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
