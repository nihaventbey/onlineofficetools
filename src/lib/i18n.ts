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

export const locales = ["en", "tr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export type ToolSharedLabels = {
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  copy: string;
  copied: string;
  clear: string;
};

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
    about: string;
    contact: string;
    legal: string;
    search: string;
    searchPlaceholder: string;
    categories: string;
    allTools: string;
    openTool: string;
    relatedTools: string;
    breadcrumbHome: string;
    noResults: string;
    exploreCta: string;
    trustPrivate: string;
    trustFast: string;
    trustFree: string;
  };
  home: {
    title: string;
    description: string;
    heroTitle: string;
    heroSubtitle: string;
    heroHighlight: string;
    toolsCount: string;
    toolsHeading: string;
    popularHeading: string;
    categoryHeading: string;
  };
  categories: {
    text: string;
    developer: string;
    security: string;
    image: string;
    calculator: string;
    pdf: string;
  };
  legal: {
    privacy: {
      title: string;
      metaDescription: string;
      body: string;
    };
    terms: {
      title: string;
      metaDescription: string;
      body: string;
    };
    about: {
      title: string;
      metaDescription: string;
      body: string;
    };
    contact: {
      title: string;
      metaDescription: string;
      body: string;
      emailLabel: string;
      email: string;
    };
  };
  tools: {
    wordCounter: ToolSharedLabels & {
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
      statsHeading: string;
      convertHeading: string;
    };
    jsonFormatter: ToolSharedLabels & {
      placeholder: string;
      format: string;
      minify: string;
      valid: string;
      invalid: string;
    };
    passwordGenerator: ToolSharedLabels & {
      length: string;
      uppercase: string;
      lowercase: string;
      numbers: string;
      symbols: string;
      generate: string;
      strength: string;
      weak: string;
      medium: string;
      strong: string;
    };
    loremIpsum: ToolSharedLabels & {
      paragraphs: string;
      words: string;
      generate: string;
    };
    textDiff: ToolSharedLabels & {
      leftPlaceholder: string;
      rightPlaceholder: string;
      compare: string;
      identical: string;
      differences: string;
    };
    base64: ToolSharedLabels & {
      inputPlaceholder: string;
      encode: string;
      decode: string;
      error: string;
    };
    caseConverter: ToolSharedLabels & {
      placeholder: string;
      uppercase: string;
      lowercase: string;
      titleCase: string;
      sentenceCase: string;
      camelCase: string;
      snakeCase: string;
      kebabCase: string;
    };
    ocr: ToolSharedLabels & {
      placeholder: string;
      dropHint: string;
      selectImage: string;
      processing: string;
      langEn: string;
      langTr: string;
      error: string;
    };
    qrGenerator: ToolSharedLabels & {
      placeholder: string;
      download: string;
      empty: string;
      error: string;
    };
    colorConverter: ToolSharedLabels & {
      picker: string;
      hex: string;
      rgb: string;
      hsl: string;
      invalid: string;
    };
    htmlEditor: ToolSharedLabels & {
      editor: string;
      preview: string;
      reset: string;
    };
    markdownPreview: ToolSharedLabels & {
      editor: string;
      preview: string;
      reset: string;
    };
    urlEncoder: ToolSharedLabels & {
      placeholder: string;
      encode: string;
      decode: string;
      error: string;
    };
    uuidGenerator: ToolSharedLabels & {
      count: string;
      generate: string;
    };
    unitConverter: ToolSharedLabels & {
      length: string;
      weight: string;
      temperature: string;
      data: string;
      from: string;
      to: string;
      value: string;
      result: string;
    };
    dateDifference: ToolSharedLabels & {
      start: string;
      end: string;
      days: string;
      weeks: string;
      months: string;
      years: string;
      invalid: string;
    };
    pdfMerge: ToolSharedLabels & {
      dropHint: string;
      selectHint: string;
      remove: string;
      download: string;
      processing: string;
      needTwo: string;
      invalidFile: string;
      tooLarge: string;
      mergeTooLarge: string;
      encrypted: string;
      error: string;
      limitHint: string;
    };
    pdfSplit: ToolSharedLabels & {
      dropHint: string;
      selectHint: string;
      remove: string;
      download: string;
      processing: string;
      rangeLabel: string;
      rangePlaceholder: string;
      pages: string;
      invalidRange: string;
      invalidFile: string;
      tooLarge: string;
      encrypted: string;
      error: string;
      limitHint: string;
    };
    pdfRotate: ToolSharedLabels & {
      dropHint: string;
      selectHint: string;
      remove: string;
      download: string;
      processing: string;
      allPages: string;
      rangeLabel: string;
      rangePlaceholder: string;
      invalidRange: string;
      invalidFile: string;
      tooLarge: string;
      encrypted: string;
      error: string;
      limitHint: string;
    };
    pdfCompress: ToolSharedLabels & {
      dropHint: string;
      selectHint: string;
      remove: string;
      download: string;
      processing: string;
      quality: string;
      rasterNote: string;
      resultSize: string;
      invalidFile: string;
      tooLarge: string;
      encrypted: string;
      error: string;
      limitHint: string;
    };
    imagesToPdf: ToolSharedLabels & {
      dropHint: string;
      selectHint: string;
      remove: string;
      download: string;
      processing: string;
      pageAuto: string;
      pageA4: string;
      invalidFile: string;
      tooLarge: string;
      error: string;
      limitHint: string;
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
