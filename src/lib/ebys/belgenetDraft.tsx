"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FitFont } from "@/lib/ebys/pageFitEstimate";
import type {
  HierarchyRelation,
  OrgParty,
  RecipientKind,
} from "@/lib/ebys/arzRicaRelation";

const STORAGE_KEY = "oot:draft:belgenet-hazirlik";

export type BelgenetTab = "yazi" | "kurum" | "sdp" | "ozet";

export type BelgenetDraft = {
  html: string;
  sender: OrgParty | null;
  recipients: OrgParty[];
  delegator: OrgParty | null;
  useDelegator: boolean;
  recipientKind: RecipientKind;
  manualRelation: HierarchyRelation | null;
  closing: string | null;
  sdpCode: string | null;
  sdpName: string | null;
  font: FitFont;
  fontSize: number;
};

const SAMPLE_HTML =
  "<p>Konu: Örnek resmi yazı</p><p>İlgi yazınız incelenmiştir.</p><p>Gereğini arz ederim.</p>";

export const initialBelgenetDraft: BelgenetDraft = {
  html: SAMPLE_HTML,
  sender: null,
  recipients: [],
  delegator: null,
  useDelegator: false,
  recipientKind: "idare",
  manualRelation: null,
  closing: null,
  sdpCode: null,
  sdpName: null,
  font: "times",
  fontSize: 12,
};

type BelgenetDraftContextValue = {
  draft: BelgenetDraft;
  setDraft: (patch: Partial<BelgenetDraft>) => void;
  resetDraft: () => void;
  hydrated: boolean;
};

const BelgenetDraftContext = createContext<BelgenetDraftContextValue | null>(
  null,
);

export function BelgenetDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<BelgenetDraft>(initialBelgenetDraft);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        setDraftState({ ...initialBelgenetDraft, ...JSON.parse(raw) });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft, hydrated]);

  const setDraft = useCallback((patch: Partial<BelgenetDraft>) => {
    setDraftState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraftState(initialBelgenetDraft);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ draft, setDraft, resetDraft, hydrated }),
    [draft, setDraft, resetDraft, hydrated],
  );

  return (
    <BelgenetDraftContext.Provider value={value}>
      {children}
    </BelgenetDraftContext.Provider>
  );
}

export function useBelgenetDraft() {
  const ctx = useContext(BelgenetDraftContext);
  if (!ctx) {
    throw new Error("useBelgenetDraft must be used within BelgenetDraftProvider");
  }
  return ctx;
}
