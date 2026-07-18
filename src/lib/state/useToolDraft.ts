"use client";

import { useCallback, useEffect, useState } from "react";

function storageKey(toolId: string): string {
  return `oot:draft:${toolId}`;
}

/**
 * Persist tool drafts in sessionStorage so language switches remount
 * the [lang] tree without losing user input. Cleared when the tab closes.
 */
export function useToolDraft<T>(toolId: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey(toolId));
      if (raw != null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // Ignore corrupt drafts.
    }
    setHydrated(true);
  }, [toolId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(storageKey(toolId), JSON.stringify(value));
    } catch {
      // Quota / private mode — ignore.
    }
  }, [toolId, value, hydrated]);

  const clear = useCallback(() => {
    setValue(initial);
    try {
      sessionStorage.removeItem(storageKey(toolId));
    } catch {
      // ignore
    }
  }, [initial, toolId]);

  return [value, setValue, clear] as const;
}
