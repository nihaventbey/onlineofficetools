"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isAdSlotEnabled, type AdPlacementKey, type AdSenseConfig } from "@/lib/adsense";

type AdSlotProps = {
  placement: AdPlacementKey;
  config: AdSenseConfig;
  /** Override the slot id from `config.slots[placement]` (e.g. a per-tool inline slot). */
  slot?: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({
  placement,
  config,
  slot: slotOverride,
  format = "auto",
  className = "",
}: AdSlotProps) {
  const pathname = usePathname();
  const pushed = useRef(false);
  const slot = slotOverride ?? config.slots[placement];
  const enabled = isAdSlotEnabled(config, placement, slotOverride);

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
        data-ad-client={config.clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
