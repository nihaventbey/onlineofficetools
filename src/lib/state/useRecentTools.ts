"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "oot-recent-tools";
const FAV_KEY = "oot-favorite-tools";
const MAX = 8;
export const RECENT_TOOLS_SYNC_EVENT = "oot-recent-tools-sync";

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event(RECENT_TOOLS_SYNC_EVENT));
  } catch {
    /* quota */
  }
}

function readState() {
  return {
    recent: readList(KEY),
    favorites: readList(FAV_KEY),
  };
}

export function useRecentTools() {
  const [recent, setRecent] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const refresh = useCallback(() => {
    const next = readState();
    setRecent(next.recent);
    setFavorites(next.favorites);
  }, []);

  useEffect(() => {
    refresh();

    function onStorage(event: StorageEvent) {
      if (event.key === KEY || event.key === FAV_KEY || event.key === null) {
        refresh();
      }
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(RECENT_TOOLS_SYNC_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(RECENT_TOOLS_SYNC_EVENT, refresh);
    };
  }, [refresh]);

  const pushRecent = useCallback((slug: string) => {
    setRecent((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX);
      writeList(KEY, next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [slug, ...prev].slice(0, 24);
      writeList(FAV_KEY, next);
      return next;
    });
  }, []);

  const clearFavorites = useCallback(() => {
    writeList(FAV_KEY, []);
    setFavorites([]);
  }, []);

  const clearRecent = useCallback(() => {
    writeList(KEY, []);
    setRecent([]);
  }, []);

  const clearAll = useCallback(() => {
    writeList(FAV_KEY, []);
    writeList(KEY, []);
    setFavorites([]);
    setRecent([]);
  }, []);

  return {
    recent,
    favorites,
    pushRecent,
    toggleFavorite,
    clearFavorites,
    clearRecent,
    clearAll,
  };
}
