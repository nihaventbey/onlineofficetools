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

export const locales = ["en", "tr", "de", "fr", "es", "it", "pt", "ru"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Native display names for the language switcher. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  ru: "Русский",
};

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

export type ToolFileLabels = ToolSharedLabels & {
  dropHint: string;
  selectHint?: string;
  remove: string;
  download: string;
  processing: string;
  invalidFile: string;
  tooLarge: string;
  error: string;
  limitHint: string;
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
    trustOnDevice: string;
    newBadge: string;
    popularBadge: string;
    betaBadge: string;
    recentTools: string;
    favoriteTools: string;
    addFavorite: string;
    removeFavorite: string;
    categoryTools: string;
    categoryDescription: string;
    nextStep: string;
    wasHelpful: string;
    yes: string;
    no: string;
    thanksFeedback: string;
    commandPalette: string;
    skipToContent: string;
    consentMessage: string;
    consentAccept: string;
    consentDecline: string;
    quickAccess: string;
    yourTools: string;
    favoritesEmpty: string;
    recentEmpty: string;
    yourToolsHint: string;
    shareLabel: string;
    shareCopied: string;
    shareCopyLink: string;
    shareNative: string;
    shareOnX: string;
    shareOnFacebook: string;
    shareOnLinkedIn: string;
    shareOnWhatsApp: string;
    shareViaEmail: string;
    shareMenu: string;
    advertisement: string;
    notFoundTitle: string;
    notFoundBody: string;
    notFoundCta: string;
    draftPreviewBanner: string;
    draftPreviewTitle: string;
  };
  toolPage: {
    howToTitle: string;
    howToStep1: string;
    howToStep2: string;
    howToStep3: string;
    faqTitle: string;
    faq1q: string;
    faq1a: string;
    faq2q: string;
    faq2a: string;
    faq3q: string;
    faq3a: string;
    faq4q: string;
    faq4a: string;
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
    documents: string;
    spreadsheets: string;
    presentations: string;
    pdf: string;
    image: string;
    archive: string;
    video: string;
    ebys: string;
    developer: string;
    security: string;
    calculator: string;
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
      linesLabel: string;
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
      alt: string;
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
      sandboxPreview: string;
      showSandbox: string;
      sampleTitle: string;
      sampleText: string;
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
    findReplace: ToolSharedLabels & {
      placeholder: string;
      find: string;
      replace: string;
      apply: string;
      trim: string;
      dedupe: string;
      sort: string;
    };
    pdfToText: ToolFileLabels & { empty: string; pages: string };
    docxViewer: ToolFileLabels & { extract: string };
    docxToHtml: ToolFileLabels;
    htmlToDocx: ToolSharedLabels & {
      placeholder: string;
      download: string;
      error: string;
    };
    docxDiff: ToolFileLabels & {
      left: string;
      right: string;
      compare: string;
      identical: string;
      differences: string;
    };
    textToPdf: ToolSharedLabels & {
      placeholder: string;
      download: string;
      error: string;
    };
    xlsxViewer: ToolFileLabels & { sheet: string; rows: string };
    xlsxToCsv: ToolFileLabels & { sheet: string };
    csvToXlsx: ToolFileLabels & { placeholder: string };
    csvEditor: ToolFileLabels & {
      addRow: string;
      addCol: string;
      placeholder: string;
    };
    imagesToPptx: ToolFileLabels;
    textToPptx: ToolSharedLabels & {
      placeholder: string;
      download: string;
      error: string;
    };
    pptxExtract: ToolFileLabels;
    pdfToImages: ToolFileLabels & {
      downloadAll: string;
      pagesLabel: string;
      pageAlt: string;
    };
    imageResize: ToolFileLabels & {
      width: string;
      height: string;
      keepRatio: string;
      percent: string;
    };
    imageCompress: ToolFileLabels & {
      quality: string;
      resultSize: string;
    };
    imageCrop: ToolFileLabels & {
      rotate: string;
      flipH: string;
      flipV: string;
      cropWidth: string;
      cropHeight: string;
    };
    imageConvert: ToolFileLabels & {
      format: string;
      quality: string;
    };
    imageMetadata: ToolFileLabels & {
      strip: string;
      info: string;
      unknownType: string;
    };
    imageEnhance: ToolFileLabels & {
      scale: string;
      sharpen: string;
      contrast: string;
      compare: string;
      before: string;
      after: string;
    };
    imageAiUpscale: ToolFileLabels & {
      start: string;
      unsupported: string;
      loadingModel: string;
      privacyNote: string;
      betaNote: string;
      fallbackNote: string;
      fallbackUsed: string;
    };
    zipCreate: ToolFileLabels & {
      fileName: string;
      fileCount: string;
    };
    zipExtract: ToolFileLabels & {
      downloadAll: string;
      fileCount: string;
      emptyZip: string;
    };
    zipViewer: ToolFileLabels & {
      fileCount: string;
      emptyZip: string;
      preview: string;
      compressed: string;
      uncompressed: string;
      noPreview: string;
    };
    videoFrames: ToolFileLabels & {
      interval: string;
      downloadAll: string;
      frameCount: string;
      frameAlt: string;
      capture: string;
    };
    videoToGif: ToolFileLabels & {
      startTime: string;
      endTime: string;
      fps: string;
      width: string;
      maxDurationHint: string;
    };
    videoTrim: ToolFileLabels & {
      startTime: string;
      endTime: string;
      muteAudio: string;
      safariWarning: string;
      duration: string;
    };
    videoInfo: ToolFileLabels & {
      duration: string;
      resolution: string;
      aspectRatio: string;
      estimatedFps: string;
      hasAudio: string;
      fileSize: string;
      mimeType: string;
      yes: string;
      no: string;
      unknown: string;
    };
    arzRica: ToolSharedLabels & {
      audienceLabel: string;
      audienceLower: string;
      audienceUpper: string;
      audiencePeer: string;
      audienceMixed: string;
      audiencePrivate: string;
      closingLabel: string;
      apply: string;
      textPlaceholder: string;
      forbiddenWarning: string;
      disclaimer: string;
      geregi: string;
      bilgi: string;
    };
    sdpSearch: ToolSharedLabels & {
      searchPlaceholder: string;
      results: string;
      noResults: string;
      copyCode: string;
      retention: string;
      note: string;
      dataVersion: string;
      loading: string;
      loadError: string;
    };
    detsis: ToolSharedLabels & {
      formatLabel: string;
      formatHint: string;
      formatValid: string;
      formatInvalid: string;
      searchPlaceholder: string;
      results: string;
      noResults: string;
      copyId: string;
      openDetsis: string;
      dataVersion: string;
      loading: string;
      loadError: string;
      snapshotWarning: string;
    };
    belgenetHtml: ToolSharedLabels & {
      placeholder: string;
      fontLabel: string;
      fontTimes: string;
      fontArial: string;
      sizeLabel: string;
      tabVisual: string;
      tabCode: string;
      copyHtml: string;
      fitHeading: string;
      fitOk: string;
      fitOverflow: string;
      fitEstimate: string;
      fitNote: string;
      sanitizeNote: string;
    };
  };
};

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("@/dictionaries/en.json").then((m) => m.default as Dictionary),
  tr: () => import("@/dictionaries/tr.json").then((m) => m.default as Dictionary),
  de: () => import("@/dictionaries/de.json").then((m) => m.default as Dictionary),
  fr: () => import("@/dictionaries/fr.json").then((m) => m.default as Dictionary),
  es: () => import("@/dictionaries/es.json").then((m) => m.default as Dictionary),
  it: () => import("@/dictionaries/it.json").then((m) => m.default as Dictionary),
  pt: () => import("@/dictionaries/pt.json").then((m) => m.default as Dictionary),
  ru: () => import("@/dictionaries/ru.json").then((m) => m.default as Dictionary),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
