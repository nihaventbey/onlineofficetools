"use client";

import { usePathname } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import { ADSENSE_SLOTS, isAdSenseConfigured } from "@/lib/adsense";

const LEGAL_SEGMENTS = new Set(["privacy", "terms", "about", "contact"]);

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segment = pathname.split("/")[2] ?? "";
  const isLegal = LEGAL_SEGMENTS.has(segment);
  const adsOn = isAdSenseConfigured();
  const showSidebar = adsOn && !isLegal;

  return (
    <>
      {!isLegal && adsOn ? (
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <AdSlot
            slot={ADSENSE_SLOTS.horizontalTop}
            format="horizontal"
            className="mb-4"
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
                slot={ADSENSE_SLOTS.verticalSidebar}
                format="vertical"
                className="ad-slot-vertical"
              />
            </div>
          </aside>
        ) : null}
      </div>

      {!isLegal && adsOn ? (
        <div className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <AdSlot
            slot={ADSENSE_SLOTS.horizontalBottom}
            format="horizontal"
            className="mt-2"
          />
        </div>
      ) : null}
    </>
  );
}
