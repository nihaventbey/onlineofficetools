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
    closeMenu: string;
    viewCategory: string;
    browseCategories: string;
    menuToolsHint: string;
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
    clearFavorites: string;
    clearRecent: string;
    clearQuickAccess: string;
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
    audio: string;
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
      downloadDocx: string;
      docxProcessing: string;
      colOriginal: string;
      colChanged: string;
      empty: string;
      docxError: string;
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
    birthdayCalculator: ToolSharedLabels & {
      birthDate: string;
      asOf: string;
      years: string;
      months: string;
      days: string;
      nextBirthday: string;
      daysUntil: string;
      todayIsBirthday: string;
      bornWeekday: string;
      hint: string;
      invalid: string;
      weekdaySun: string;
      weekdayMon: string;
      weekdayTue: string;
      weekdayWed: string;
      weekdayThu: string;
      weekdayFri: string;
      weekdaySat: string;
    };
    areaCalculator: ToolSharedLabels & {
      hint: string;
      shapeRectangle: string;
      shapeTriangle: string;
      shapePolygon: string;
      addVertex: string;
      scaleLabel: string;
      scaleHint: string;
      area: string;
      perimeter: string;
      unitArea: string;
      unitLength: string;
      sidesHeading: string;
      side: string;
      sidesHint: string;
      liveCheck: string;
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
      aspect: string;
      aspect_free: string;
      aspect_16_9: string;
      aspect_1_1: string;
      aspect_9_16: string;
      aspect_4_3: string;
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
    watermark: ToolFileLabels & {
      encrypted: string;
      mode: string;
      modeText: string;
      modeImage: string;
      textLabel: string;
      textPlaceholder: string;
      defaultText: string;
      fontLabel: string;
      colorLabel: string;
      stampLabel: string;
      stampDropHint: string;
      stampSelectHint: string;
      invalidStamp: string;
      needStamp: string;
      emptyText: string;
      position: string;
      tile: string;
      tileGap: string;
      opacity: string;
      rotation: string;
      scale: string;
      preview: string;
      previewEmpty: string;
      pdfPreviewHint: string;
      kindImage: string;
      kindPdf: string;
      fileCount: string;
      tooManyFiles: string;
      processingFile: string;
      downloadZip: string;
      pos_tl: string;
      pos_tc: string;
      pos_tr: string;
      pos_ml: string;
      pos_mc: string;
      pos_mr: string;
      pos_bl: string;
      pos_bc: string;
      pos_br: string;
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
    videoWatermark: ToolFileLabels & {
      safariWarning: string;
      modeText: string;
      modeImage: string;
      textLabel: string;
      defaultText: string;
      fontLabel: string;
      colorLabel: string;
      stampDropHint: string;
      stampSelectHint: string;
      invalidStamp: string;
      needStamp: string;
      emptyText: string;
      position: string;
      tile: string;
      opacity: string;
      rotation: string;
      scale: string;
      preview: string;
      startTime: string;
      endTime: string;
      muteAudio: string;
      tooLong: string;
    };
    audioEditor: ToolFileLabels & {
      decodeError: string;
      waveform: string;
      waveformHint: string;
      startTime: string;
      endTime: string;
      selection: string;
      play: string;
      pause: string;
      formatLabel: string;
      formatWav: string;
      formatMp3: string;
      formatWebm: string;
      formatOgg: string;
      formatHint: string;
      safariWarning: string;
      webmUnsupported: string;
      oggUnsupported: string;
    };
    videoCrop: ToolFileLabels & {
      safariWarning: string;
      preview: string;
      dragHint: string;
      cropPreview: string;
      aspect: string;
      aspect_free: string;
      aspect_16_9: string;
      aspect_1_1: string;
      aspect_9_16: string;
      aspect_4_3: string;
      cropX: string;
      cropY: string;
      cropWidth: string;
      cropHeight: string;
      startTime: string;
      endTime: string;
      muteAudio: string;
      tooLong: string;
    };
    videoResize: ToolFileLabels & {
      safariWarning: string;
      dragHint: string;
      outputPreview: string;
      groupVertical: string;
      groupHorizontal: string;
      groupSquare: string;
      presetReels: string;
      presetStories: string;
      presetShorts: string;
      presetTiktok: string;
      presetYt1080: string;
      presetYt720: string;
      presetFbLand: string;
      presetXLand: string;
      presetIgSquare: string;
      cropX: string;
      cropY: string;
      cropWidth: string;
      cropHeight: string;
      startTime: string;
      endTime: string;
      muteAudio: string;
      tooLong: string;
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
      senderLabel: string;
      recipientLabel: string;
      searchPlaceholder: string;
      noResults: string;
      addRecipientHint: string;
      removeRecipient: string;
      kindIdare: string;
      kindPrivate: string;
      kindPerson: string;
      delegatorToggle: string;
      delegatorLabel: string;
      manualOverride: string;
      manualAuto: string;
      relLower: string;
      relUpper: string;
      relPeer: string;
      relMixed: string;
      relUncertain: string;
      resultHeading: string;
      relationLabel: string;
      confidenceLabel: string;
      confidenceAutomatic: string;
      confidenceRule: string;
      confidenceUncertain: string;
      confidenceManual: string;
      variantLabel: string;
      closingLabel: string;
      apply: string;
      textPlaceholder: string;
      forbiddenWarning: string;
      disclaimer: string;
      snapshotWarning: string;
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
    belgenetPrep: ToolSharedLabels & {
      tabYazi: string;
      tabKurum: string;
      tabSdp: string;
      tabOzet: string;
      workflowHint: string;
      yazi: {
        copy: string;
        copied: string;
        clear: string;
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
      kurum: {
        copy: string;
        copied: string;
        clear: string;
        senderLabel: string;
        recipientLabel: string;
        searchPlaceholder: string;
        noResults: string;
        addRecipientHint: string;
        removeRecipient: string;
        kindIdare: string;
        kindPrivate: string;
        kindPerson: string;
        delegatorToggle: string;
        delegatorLabel: string;
        manualOverride: string;
        manualAuto: string;
        relLower: string;
        relUpper: string;
        relPeer: string;
        relMixed: string;
        relUncertain: string;
        resultHeading: string;
        relationLabel: string;
        confidenceLabel: string;
        confidenceAutomatic: string;
        confidenceRule: string;
        confidenceUncertain: string;
        confidenceManual: string;
        variantLabel: string;
        apply: string;
        disclaimer: string;
        snapshotWarning: string;
      };
      sdp: {
        copy: string;
        copied: string;
        clear: string;
        searchPlaceholder: string;
        results: string;
        noResults: string;
        copyCode: string;
        select: string;
        selected: string;
        retention: string;
        archiveGrade: string;
        note: string;
        dataVersion: string;
        loading: string;
        loadError: string;
        planAll: string;
        sectionOnly: string;
        staleWarning: string;
        officialSource: string;
      };
      ozet: ToolSharedLabels & {
        checklistHeading: string;
        checkSender: string;
        checkRecipient: string;
        checkClosing: string;
        checkSdp: string;
        checkPageFit: string;
        notSet: string;
        fitOk: string;
        fitOverflow: string;
        subjectLineHeading: string;
        subjectLineHint: string;
        copySubject: string;
        forbiddenWarning: string;
        disclaimer: string;
      };
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
  const dict = await dictionaries[locale]();
  if (!dict.tools.belgenetPrep) {
    const tr = await dictionaries.tr();
    dict.tools.belgenetPrep = tr.tools.belgenetPrep;
  }
  return dict;
}
