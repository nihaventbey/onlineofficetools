import { defaultLocale, locales } from "@/lib/i18n";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://onlineofficetools.com";

export function absoluteUrl(path: string): string {
  const base = SITE_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/**
 * hreflang alternates for a locale-relative path (e.g. "/tools/word-counter").
 * Includes an x-default entry pointing at the default (en) version,
 * as recommended by Google for multilingual sites.
 */
export function languageAlternates(path: string): Record<string, string> {
  const normalized = path === "/" ? "" : path;
  const entries = locales.map(
    (locale) => [locale, absoluteUrl(`/${locale}${normalized}`)] as const,
  );
  return {
    ...Object.fromEntries(entries),
    "x-default": absoluteUrl(`/${defaultLocale}${normalized}`),
  };
}
