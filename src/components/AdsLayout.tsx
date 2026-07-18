"use client";

import { usePathname } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import { ADSENSE_SLOTS } from "@/lib/adsense";

const LEGAL_SEGMENTS = new Set(["privacy", "terms", "about", "contact"]);

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segment = pathname.split("/")[2] ?? "";
  const isLegal = LEGAL_SEGMENTS.has(segment);

  return (
    <>
      {!isLegal ? (
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <AdSlot
            slot={ADSENSE_SLOTS.horizontalTop}
            format="horizontal"
            className="mb-4"
          />
        </div>
      ) : null}

      <div
        className={`mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-2 sm:px-6 ${
          isLegal ? "" : "lg:grid-cols-[minmax(0,1fr)_300px]"
        }`}
      >
        <main className="min-w-0">{children}</main>
        {!isLegal ? (
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

      {!isLegal ? (
        <div className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
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
