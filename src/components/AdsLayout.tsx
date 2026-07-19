"use client";

import { usePathname } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import type { AdSenseConfig } from "@/lib/adsense";

const LEGAL_SEGMENTS = new Set(["privacy", "terms", "about", "contact"]);

type AdsLayoutProps = {
  children: React.ReactNode;
  adConfig: AdSenseConfig;
  adLabel?: string;
};

export default function AdsLayout({ children, adConfig, adLabel }: AdsLayoutProps) {
  const pathname = usePathname();
  const segment = pathname.split("/")[2] ?? "";
  const isLegal = LEGAL_SEGMENTS.has(segment);
  const adsOn = adConfig.enabled && !isLegal;
  const showTop = adsOn && adConfig.placements.top;
  const showBottom = adsOn && adConfig.placements.bottom;
  const showSidebar = adsOn && adConfig.placements.sidebar;

  return (
    <>
      {showTop ? (
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <AdSlot
            placement="top"
            config={adConfig}
            format="horizontal"
            className="mb-4"
            label={adLabel}
          />
        </div>
      ) : null}

      <div
        className={`mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-4 sm:px-6 lg:px-8 ${
          showSidebar ? "lg:grid-cols-[minmax(0,1fr)_280px]" : ""
        }`}
      >
        <main id="main-content" className="min-w-0">
          {children}
        </main>
        {showSidebar ? (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <AdSlot
                placement="sidebar"
                config={adConfig}
                format="vertical"
                className="ad-slot-vertical"
                label={adLabel}
              />
            </div>
          </aside>
        ) : null}
      </div>

      {showBottom ? (
        <div className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <AdSlot
            placement="bottom"
            config={adConfig}
            format="horizontal"
            className="mt-2"
            label={adLabel}
          />
        </div>
      ) : null}
    </>
  );
}
