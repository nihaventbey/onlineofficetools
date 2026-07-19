import fs from "node:fs";
import path from "node:path";

const shared = (title, description, metaTitle, metaDescription) => ({
  title,
  description,
  metaTitle,
  metaDescription,
  copy: "Copy",
  copied: "Copied!",
  clear: "Clear",
});

const tools = {
  arzRica: {
    ...shared(
      "Arz / Rica",
      "Suggest official Turkish closing phrases by audience hierarchy.",
      "Arz / Rica — Official Docs Helper",
      "Pick muhatap hierarchy and get Arz/Rica closing phrases.",
    ),
    audienceLabel: "Audience",
    audienceLower: "Lower (subordinate)",
    audienceUpper: "Upper (superior)",
    audiencePeer: "Peer / same level",
    audienceMixed: "Mixed distribution",
    audiencePrivate: "Private sector",
    closingLabel: "Closing",
    apply: "Apply to text",
    textPlaceholder: "Paste your draft letter…",
    forbiddenWarning: "Discouraged phrase detected",
    disclaimer:
      "Suggestion only; follow your institution’s correspondence rules.",
    geregi: "Gereğini…",
    bilgi: "Bilgi…",
  },
  sdpSearch: {
    ...shared(
      "SDP Search",
      "Search Turkish Standard File Plan (SSDP) codes.",
      "SDP Search — Official Docs Helper",
      "Search SSDP codes locally from a static snapshot.",
    ),
    searchPlaceholder: "Search by code or name…",
    results: "Results",
    noResults: "No matches.",
    copyCode: "Copy code",
    retention: "Retention",
    note: "Note",
    dataVersion: "Data version",
    loading: "Loading data…",
    loadError: "Could not load SDP data.",
  },
  detsis: {
    ...shared(
      "DETSIS",
      "Validate 8-digit DETSIS IDs and search a local snapshot.",
      "DETSIS — Official Docs Helper",
      "Check DETSIS number format and search a snapshot.",
    ),
    formatLabel: "DETSIS number",
    formatHint: "Exactly 8 digits.",
    formatValid: "Format looks valid.",
    formatInvalid: "Must be exactly 8 digits.",
    searchPlaceholder: "Search institution name or number…",
    results: "Results",
    noResults: "No matches in snapshot.",
    copyId: "Copy ID",
    openDetsis: "Open detsis.gov.tr",
    dataVersion: "Data version",
    loading: "Loading snapshot…",
    loadError: "Could not load DETSIS snapshot.",
    snapshotWarning:
      "Snapshot incomplete — use format check and open DETSIS for authoritative data.",
  },
  belgenetHtml: {
    ...shared(
      "Belgenet HTML",
      "Build paste-friendly HTML for Belgenet with page-fit estimate.",
      "Belgenet HTML — Official Docs Helper",
      "Sanitize HTML for Belgenet paste and estimate first-page fit.",
    ),
    placeholder: "Paste plain text…",
    fontLabel: "Font",
    fontTimes: "Times New Roman 12",
    fontArial: "Arial 11",
    sizeLabel: "Size",
    tabVisual: "Visual",
    tabCode: "HTML",
    copyHtml: "Copy HTML",
    fitHeading: "Page fit (estimate)",
    fitOk: "Signature likely fits on page 1.",
    fitOverflow: "Content may spill onto page 2.",
    fitEstimate: "≈ {height} mm of {page} mm ({pct}%).",
    fitNote: "Estimate only — Belgenet layout may differ.",
    sanitizeNote:
      "Copy strips styles/scripts; allowed tags: p, br, strong, em, u, lists.",
  },
};

const trTools = {
  arzRica: {
    title: "Arz / Rica",
    description:
      "Muhatap hiyerarşisine göre resmi yazı kapanış cümlesi önerir.",
    metaTitle: "Arz / Rica — Belgenet Hazırlık",
    metaDescription:
      "Alt, üst, aynı düzey ve karışık dağıtıma göre arz/rica kapanışı.",
    copy: "Kopyala",
    copied: "Kopyalandı!",
    clear: "Temizle",
    audienceLabel: "Muhatap",
    audienceLower: "Alt makam",
    audienceUpper: "Üst makam",
    audiencePeer: "Aynı düzey",
    audienceMixed: "Karışık dağıtım",
    audiencePrivate: "Özel sektör",
    closingLabel: "Kapanış",
    apply: "Metne uygula",
    textPlaceholder: "Taslak yazınızı yapıştırın…",
    forbiddenWarning: "Yasaklı / önerilmeyen kalıp",
    disclaimer:
      "Öneri niteliğindedir; kurumunuzun yazışma prosedürü esas alınmalıdır.",
    geregi: "Gereğini…",
    bilgi: "Bilgi…",
  },
  sdpSearch: {
    title: "SDP Arama",
    description:
      "Saklama Süreli Standart Dosya Planı kodlarını arayın ve kopyalayın.",
    metaTitle: "SDP Arama — Belgenet Hazırlık",
    metaDescription: "SSDP kod ve ad araması; kodu kopyalayın.",
    copy: "Kopyala",
    copied: "Kopyalandı!",
    clear: "Temizle",
    searchPlaceholder: "Kod veya ad ile ara…",
    results: "Sonuçlar",
    noResults: "Eşleşme yok.",
    copyCode: "Kodu kopyala",
    retention: "Saklama",
    note: "Not",
    dataVersion: "Veri sürümü",
    loading: "Veri yükleniyor…",
    loadError: "SDP verisi yüklenemedi.",
  },
  detsis: {
    title: "DETSİS",
    description:
      "Kurum DETSİS numarasını doğrulayın ve anlık görüntüde arayın.",
    metaTitle: "DETSİS — Belgenet Hazırlık",
    metaDescription: "8 haneli DETSİS formatı ve yerel anlık görüntü araması.",
    copy: "Kopyala",
    copied: "Kopyalandı!",
    clear: "Temizle",
    formatLabel: "DETSİS numarası",
    formatHint: "Tam 8 hane olmalıdır.",
    formatValid: "Biçim geçerli görünüyor.",
    formatInvalid: "Tam 8 rakam olmalıdır.",
    searchPlaceholder: "Kurum adı veya numara ara…",
    results: "Sonuçlar",
    noResults: "Anlık görüntüde eşleşme yok.",
    copyId: "Numarayı kopyala",
    openDetsis: "detsis.gov.tr’de aç",
    dataVersion: "Veri sürümü",
    loading: "Anlık görüntü yükleniyor…",
    loadError: "DETSİS anlık görüntüsü yüklenemedi.",
    snapshotWarning:
      "Anlık görüntü eksik — biçim kontrolü ve DETSİS sitesi kullanın; resmi kaynak DETSİS’tir.",
  },
  belgenetHtml: {
    title: "Belgenet HTML",
    description:
      "Belgenet’e yapıştırılacak dar HTML üretin; sayfa sığdırma tahmini alın.",
    metaTitle: "Belgenet HTML — Belgenet Hazırlık",
    metaDescription: "Times/Arial ile Belgenet HTML; sayfa sığdırma göstergesi.",
    copy: "Kopyala",
    copied: "Kopyalandı!",
    clear: "Temizle",
    placeholder: "Düz metin yapıştır…",
    fontLabel: "Yazı tipi",
    fontTimes: "Times New Roman 12",
    fontArial: "Arial 11",
    sizeLabel: "Punto",
    tabVisual: "Görsel",
    tabCode: "HTML",
    copyHtml: "HTML’i kopyala",
    fitHeading: "Sayfa sığdırma (tahmini)",
    fitOk: "İmza büyük olasılıkla 1. sayfada.",
    fitOverflow: "İçerik 2. sayfaya taşıyor olabilir.",
    fitEstimate: "≈ {height} mm / {page} mm ({pct}%).",
    fitNote: "Tahminidir — Belgenet düzeni farklı olabilir.",
    sanitizeNote:
      "Kopyalama stil/script temizler; izinli etiketler: p, br, strong, em, u, listeler.",
  },
};

const stubs = {
  de: {
    ebys: "Amtliche Docs (TR)",
    copy: "Kopieren",
    copied: "Kopiert!",
    clear: "Leeren",
  },
  fr: {
    ebys: "Docs officiels (TR)",
    copy: "Copier",
    copied: "Copié !",
    clear: "Effacer",
  },
  es: {
    ebys: "Docs oficiales (TR)",
    copy: "Copiar",
    copied: "¡Copiado!",
    clear: "Borrar",
  },
  it: {
    ebys: "Documenti ufficiali (TR)",
    copy: "Copia",
    copied: "Copiato!",
    clear: "Cancella",
  },
  pt: {
    ebys: "Docs oficiais (TR)",
    copy: "Copiar",
    copied: "Copiado!",
    clear: "Limpar",
  },
  ru: {
    ebys: "Офиц. док. (TR)",
    copy: "Копировать",
    copied: "Скопировано!",
    clear: "Очистить",
  },
};

function stubTools(loc) {
  const s = stubs[loc];
  const out = {};
  for (const [key, en] of Object.entries(tools)) {
    out[key] = { ...en, copy: s.copy, copied: s.copied, clear: s.clear };
  }
  return out;
}

const dir = path.resolve("src/dictionaries");
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const loc = file.replace(".json", "");
  const p = path.join(dir, file);
  const d = JSON.parse(fs.readFileSync(p, "utf8"));
  if (loc === "tr") {
    d.categories.ebys = "EBYS / Belgenet";
    Object.assign(d.tools, trTools);
  } else if (loc === "en") {
    d.categories.ebys = "Official docs (TR)";
    Object.assign(d.tools, tools);
  } else if (stubs[loc]) {
    d.categories.ebys = stubs[loc].ebys;
    Object.assign(d.tools, stubTools(loc));
  }
  fs.writeFileSync(p, `${JSON.stringify(d, null, 2)}\n`);
  console.log("patched", loc);
}
