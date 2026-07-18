"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "oot-recent-tools";
const FAV_KEY = "oot-favorite-tools";
const MAX = 8;

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
  } catch {
    /* quota */
  }
}

export function useRecentTools() {
  const [recent, setRecent] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readList(KEY));
    setFavorites(readList(FAV_KEY));
  }, []);

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

  return { recent, favorites, pushRecent, toggleFavorite };
}
