/** Locale constants only — safe for Edge middleware (no dictionary JSON). */
export const locales = ["en", "tr", "de", "fr", "es", "it", "pt", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
