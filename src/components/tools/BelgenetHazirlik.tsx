"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import {
  BelgenetDraftProvider,
  type BelgenetTab,
} from "@/lib/ebys/belgenetDraft";
import KurumPanel from "@/components/tools/belgenet/KurumPanel";
import OzetPanel from "@/components/tools/belgenet/OzetPanel";
import SdpPanel from "@/components/tools/belgenet/SdpPanel";
import YaziPanel from "@/components/tools/belgenet/YaziPanel";

type Props = { labels: Dictionary["tools"]["belgenetPrep"] };

const TABS: { id: BelgenetTab; key: keyof Props["labels"] }[] = [
  { id: "yazi", key: "tabYazi" },
  { id: "kurum", key: "tabKurum" },
  { id: "sdp", key: "tabSdp" },
  { id: "ozet", key: "tabOzet" },
];

function isBelgenetTab(v: string | null): v is BelgenetTab {
  return v === "yazi" || v === "kurum" || v === "sdp" || v === "ozet";
}

function BelgenetHazirlikInner({ labels }: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<BelgenetTab>(
    isBelgenetTab(tabParam) ? tabParam : "yazi",
  );

  useEffect(() => {
    if (isBelgenetTab(tabParam)) setTab(tabParam);
  }, [tabParam]);

  const onTab = useCallback((id: BelgenetTab) => {
    setTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url.toString());
  }, []);

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-slate-600">{labels.workflowHint}</p>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
        {TABS.map(({ id, key }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${
              tab === id
                ? "bg-amber-700 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {labels[key] as string}
          </button>
        ))}
      </div>

      {tab === "yazi" ? <YaziPanel labels={labels.yazi} /> : null}
      {tab === "kurum" ? <KurumPanel labels={labels.kurum} /> : null}
      {tab === "sdp" ? <SdpPanel labels={labels.sdp} /> : null}
      {tab === "ozet" ? <OzetPanel labels={labels.ozet} /> : null}
    </div>
  );
}

export default function BelgenetHazirlik({ labels }: Props) {
  return (
    <BelgenetDraftProvider>
      <Suspense
        fallback={
          <p className="text-sm text-slate-500">{labels.workflowHint}</p>
        }
      >
        <BelgenetHazirlikInner labels={labels} />
      </Suspense>
    </BelgenetDraftProvider>
  );
}
