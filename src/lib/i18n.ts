/** Locales planned for scale-out (activate by adding a dictionary JSON). */
export const plannedLocales = [
  "en",
  "tr",
  "de",
  "fr",
  "es",
  "it",
  "pt",
  "nl",
  "pl",
  "ru",
  "uk",
  "ar",
  "hi",
  "id",
  "ja",
  "ko",
  "zh",
  "vi",
  "th",
  "sv",
] as const;

export type PlannedLocale = (typeof plannedLocales)[number];

/** Currently shipped locales (dictionary files exist). */
export const locales = ["en", "tr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export type Dictionary = {
  common: {
    siteName: string;
    siteTagline: string;
    home: string;
    tools: string;
    language: string;
    footerRights: string;
    privacy: string;
    terms: string;
  };
  home: {
    title: string;
    description: string;
    heroTitle: string;
    heroSubtitle: string;
    toolsHeading: string;
    openTool: string;
  };
  tools: {
    wordCounter: {
      title: string;
      description: string;
      metaTitle: string;
      metaDescription: string;
      placeholder: string;
      words: string;
      characters: string;
      charactersNoSpaces: string;
      lines: string;
      sentences: string;
      uppercase: string;
      lowercase: string;
      titleCase: string;
      sentenceCase: string;
      copy: string;
      copied: string;
      clear: string;
      statsHeading: string;
      convertHeading: string;
    };
  };
};

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("@/dictionaries/en.json").then((m) => m.default as Dictionary),
  tr: () => import("@/dictionaries/tr.json").then((m) => m.default as Dictionary),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
