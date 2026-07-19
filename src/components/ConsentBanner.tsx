"use client";

import { useEffect, useState } from "react";
import {
  CONSENT_CHANGE_EVENT,
  CONSENT_STORAGE_KEY,
  type ConsentChangeDetail,
} from "@/lib/adsense";

const KEY = CONSENT_STORAGE_KEY;

type Props = {
  message: string;
  acceptLabel: string;
  declineLabel: string;
};

export default function ConsentBanner({
  message,
  acceptLabel,
  declineLabel,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function choose(value: "accepted" | "declined") {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
    window.dispatchEvent(
      new CustomEvent<ConsentChangeDetail>(CONSENT_CHANGE_EVENT, {
        detail: { accepted: value === "accepted" },
      }),
    );
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium"
          >
            {declineLabel}
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="min-h-10 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white"
          >
            {acceptLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
