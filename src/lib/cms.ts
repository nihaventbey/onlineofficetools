import { createClient } from "@supabase/supabase-js";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";
import type { Database, PublishedTool, ToolTranslationRow } from "@/lib/supabase/types";
import { getToolBySlug, isRegisteredSlug, isToolAvailableInLocale, toolRegistry } from "@/lib/tools/registry";
import { isToolCategory, type ToolCategory } from "@/lib/tools/categories";
import {
  ADSENSE_SETTING_KEYS,
  resolveAdSenseConfig,
  type AdSenseConfig,
} from "@/lib/adsense";

export type CmsToolCard = {
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  sortOrder: number;
  category: ToolCategory;
};

export type CmsToolFaq = { q: string; a: string };

export type CmsToolPage = {
  slug: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  content: string | null;
  coverUrl: string | null;
  category: ToolCategory;
  faqs: CmsToolFaq[];
  howtoSteps: string[];
};

function parseFaqs(value: unknown): CmsToolFaq[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is CmsToolFaq =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as CmsToolFaq).q === "string" &&
      typeof (item as CmsToolFaq).a === "string" &&
      Boolean((item as CmsToolFaq).q.trim()) &&
      Boolean((item as CmsToolFaq).a.trim()),
  );
}

function parseHowtoSteps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((step) => step.trim())
    .filter(Boolean);
}

const MEDIA_BUCKET = "cms-media";

function getBuildClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function publicMediaUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

function pickTranslation(
  translations: ToolTranslationRow[],
  locale: Locale,
): ToolTranslationRow | undefined {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === "en")
  );
}

/**
 * Localized labels from the bundled dictionaries (available for every locale),
 * used when the CMS has no translation row for the requested locale.
 */
function dictLabels(slug: string, dict: Dictionary) {
  const reg = getToolBySlug(slug);
  if (!reg) return null;
  const labels = dict.tools[reg.dictKey];
  return {
    title: labels.title,
    description: labels.description,
    seoTitle: labels.metaTitle,
    seoDescription: labels.metaDescription,
  };
}

const FALLBACK_COPY: Record<
  string,
  { en: string; tr: string; enDesc: string; trDesc: string }
> = {
  "word-counter": {
    en: "Word Counter",
    tr: "Kelime Sayacı",
    enDesc: "Count words, characters, lines, and sentences instantly.",
    trDesc: "Kelime, karakter, satır ve cümleleri anında sayın.",
  },
  "case-converter": {
    en: "Case Converter",
    tr: "Harf Dönüştürücü",
    enDesc: "Convert text between common case formats.",
    trDesc: "Metni yaygın harf biçimleri arasında dönüştürün.",
  },
  "lorem-ipsum": {
    en: "Lorem Ipsum Generator",
    tr: "Lorem Ipsum Üretici",
    enDesc: "Generate placeholder paragraphs for designs and drafts.",
    trDesc: "Tasarım ve taslaklar için yer tutucu paragraflar üretin.",
  },
  "text-diff": {
    en: "Text Diff Checker",
    tr: "Metin Karşılaştırıcı",
    enDesc: "Compare two texts and highlight differences.",
    trDesc: "İki metni karşılaştırın ve farkları görün.",
  },
  "json-formatter": {
    en: "JSON Formatter",
    tr: "JSON Biçimlendirici",
    enDesc: "Pretty-print, minify, and validate JSON in your browser.",
    trDesc: "JSON’u tarayıcınızda güzelleştirin, küçültün ve doğrulayın.",
  },
  base64: {
    en: "Base64 Encode / Decode",
    tr: "Base64 Kodla / Çöz",
    enDesc: "Encode or decode Base64 text locally.",
    trDesc: "Base64 metni yerelde kodlayın veya çözün.",
  },
  "html-editor": {
    en: "HTML Editor",
    tr: "HTML Editör",
    enDesc: "Edit HTML and preview it live in a sandboxed iframe.",
    trDesc: "HTML düzenleyin ve güvenli önizlemede canlı görün.",
  },
  "markdown-preview": {
    en: "Markdown Preview",
    tr: "Markdown Önizleme",
    enDesc: "Write Markdown and preview rendered HTML safely.",
    trDesc: "Markdown yazın ve güvenli HTML önizlemesini görün.",
  },
  "url-encoder": {
    en: "URL Encode / Decode",
    tr: "URL Kodla / Çöz",
    enDesc: "Encode or decode URL components locally.",
    trDesc: "URL bileşenlerini yerelde kodlayın veya çözün.",
  },
  "uuid-generator": {
    en: "UUID Generator",
    tr: "UUID Üretici",
    enDesc: "Generate UUID v4 identifiers with Web Crypto.",
    trDesc: "Web Crypto ile UUID v4 tanımlayıcılar üretin.",
  },
  "password-generator": {
    en: "Password Generator",
    tr: "Şifre Üretici",
    enDesc: "Generate strong passwords with Web Crypto in your browser.",
    trDesc: "Web Crypto ile tarayıcınızda güçlü şifreler üretin.",
  },
  ocr: {
    en: "OCR — Image to Text",
    tr: "OCR — Görselden Metin",
    enDesc: "Extract text from images entirely in your browser.",
    trDesc: "Görsellerdeki metni tamamen tarayıcınızda çıkarın.",
  },
  "qr-generator": {
    en: "QR Code Generator",
    tr: "QR Kod Üretici",
    enDesc: "Create QR codes from text or URLs and download as PNG.",
    trDesc: "Metin veya URL'den QR kod oluşturun ve PNG indirin.",
  },
  "color-converter": {
    en: "Color Converter",
    tr: "Renk Dönüştürücü",
    enDesc: "Convert between HEX, RGB, and HSL with a live color picker.",
    trDesc: "HEX, RGB ve HSL arasında dönüştürün; canlı renk seçici.",
  },
  "unit-converter": {
    en: "Unit Converter",
    tr: "Birim Dönüştürücü",
    enDesc: "Convert length, weight, temperature, and data units.",
    trDesc: "Uzunluk, ağırlık, sıcaklık ve veri birimlerini dönüştürün.",
  },
  "date-difference": {
    en: "Date Difference",
    tr: "Tarih Farkı",
    enDesc: "Calculate days, weeks, months, and years between two dates.",
    trDesc: "İki tarih arasındaki gün, hafta, ay ve yılı hesaplayın.",
  },
  "pdf-merge": {
    en: "Merge PDF",
    tr: "PDF Birleştir",
    enDesc: "Combine multiple PDF files into one, in your browser.",
    trDesc: "Birden fazla PDF dosyasını tarayıcınızda tek dosyada birleştirin.",
  },
  "pdf-split": {
    en: "Split PDF",
    tr: "PDF Böl",
    enDesc: "Extract pages or page ranges into a new PDF.",
    trDesc: "Sayfa veya sayfa aralıklarını yeni bir PDF olarak çıkarın.",
  },
  "pdf-rotate": {
    en: "Rotate PDF",
    tr: "PDF Döndür",
    enDesc: "Rotate all or selected pages by 90°, 180°, or 270°.",
    trDesc: "Tüm veya seçili sayfaları 90°, 180° veya 270° döndürün.",
  },
  "pdf-compress": {
    en: "Compress PDF",
    tr: "PDF Sıkıştır",
    enDesc: "Reduce PDF size by re-encoding pages as images.",
    trDesc: "Sayfaları yeniden kodlayarak PDF boyutunu küçültün.",
  },
  "images-to-pdf": {
    en: "Images to PDF",
    tr: "Görsellerden PDF",
    enDesc: "Convert PNG or JPG images into a single PDF.",
    trDesc: "PNG veya JPG görsellerini tek bir PDF'e dönüştürün.",
  },
  "zip-create": {
    en: "Create ZIP",
    tr: "ZIP Oluştur",
    enDesc: "Pack multiple files into a ZIP archive in your browser.",
    trDesc: "Birden fazla dosyayı tarayıcıda ZIP arşivine paketleyin.",
  },
  "zip-extract": {
    en: "Extract ZIP",
    tr: "ZIP Aç",
    enDesc: "Open a ZIP archive and download files individually or all at once.",
    trDesc: "ZIP arşivini açın; dosyaları tek tek veya toplu indirin.",
  },
  "zip-viewer": {
    en: "ZIP Viewer",
    tr: "ZIP Görüntüleyici",
    enDesc: "Inspect ZIP contents, sizes, and preview text or images.",
    trDesc: "ZIP içeriğini, boyutları inceleyin; metin veya görsel önizleyin.",
  },
  "video-frame-extractor": {
    en: "Video Frame Extractor",
    tr: "Video Kare Çıkarıcı",
    enDesc: "Capture still frames from a video as PNG images.",
    trDesc: "Videodan PNG kareler yakalayın.",
  },
  "video-to-gif": {
    en: "Video to GIF",
    tr: "Videodan GIF",
    enDesc: "Convert a short video clip into an animated GIF.",
    trDesc: "Kısa bir video klipini animasyonlu GIF'e dönüştürün.",
  },
  "video-trim": {
    en: "Trim Video",
    tr: "Video Kes",
    enDesc: "Cut a time range and optionally mute audio. Output is WebM.",
    trDesc: "Zaman aralığını kesin ve isteğe bağlı olarak sesi kapatın. Çıktı WebM.",
  },
  "video-metadata": {
    en: "Video Metadata",
    tr: "Video Meta Verisi",
    enDesc: "View duration, resolution, aspect ratio, and other video details.",
    trDesc: "Süre, çözünürlük, en-boy oranı ve diğer video ayrıntılarını görün.",
  },
  "video-watermark": {
    en: "Video Watermark",
    tr: "Video Filigran",
    enDesc: "Add text or logo watermarks to videos in your browser.",
    trDesc: "Videolara metin veya logo filigranı ekleyin.",
  },
  "video-crop": {
    en: "Video Crop",
    tr: "Video Kırp",
    enDesc: "Crop videos to free size or common aspect ratios.",
    trDesc: "Videoları serbest veya hazır en-boy oranına kırpın.",
  },
  watermark: {
    en: "Watermark",
    tr: "Filigran (Watermark)",
    enDesc: "Add text or image watermarks to photos and PDFs.",
    trDesc: "Görsellere ve PDF'lere metin veya logo filigranı ekleyin.",
  },
  "pdf-watermark": {
    en: "PDF Watermark",
    tr: "PDF Filigran",
    enDesc: "Add text or image watermarks to PDFs and images in batch.",
    trDesc: "PDF ve görsellere toplu metin veya logo filigranı ekleyin.",
  },
};

async function fallbackTools(locale: Locale): Promise<CmsToolCard[]> {
  const dict = await getDictionary(locale);
  return toolRegistry
    .filter((tool) => isToolAvailableInLocale(tool.slug, locale))
    .map((tool, index) => {
      const labels = dictLabels(tool.slug, dict);
      const meta = FALLBACK_COPY[tool.slug];
      return {
        slug: tool.slug,
        title:
          labels?.title ??
          (locale === "tr" ? meta?.tr : meta?.en) ??
          tool.slug,
        description:
          labels?.description ??
          (locale === "tr" ? meta?.trDesc : meta?.enDesc) ??
          "",
        coverUrl: null,
        sortOrder: index,
        category: tool.category,
      };
    });
}

/** CMS category wins when it is a recognized category; otherwise fall back to the registry. */
function resolveCategory(cmsCategory: string | null, slug: string): ToolCategory {
  if (cmsCategory && isToolCategory(cmsCategory)) return cmsCategory;
  return getToolBySlug(slug)?.category ?? "text";
}

async function offlineTool(slug: string, locale: Locale): Promise<CmsToolPage | null> {
  const card = (await fallbackTools(locale)).find((c) => c.slug === slug);
  if (!card) return null;
  return {
    slug: card.slug,
    title: card.title,
    description: card.description,
    seoTitle: card.title,
    seoDescription: card.description,
    content: null,
    coverUrl: null,
    category: card.category,
    faqs: [],
    howtoSteps: [],
  };
}

/**
 * Published tool cards for listing pages.
 *
 * When Supabase is reachable, this is the source of truth: only tools that
 * exist in the CMS with status "published" AND are present in the local
 * tool registry (allowlist) are returned — unpublished/missing tools never
 * leak through a fallback overlay. When Supabase is not configured or the
 * query fails, we fall back to the local registry/dictionaries (offline
 * mode) so the site keeps working without a CMS.
 */
export async function getPublishedTools(locale: Locale): Promise<CmsToolCard[]> {
  const supabase = getBuildClient();
  if (!supabase) return fallbackTools(locale);

  const { data, error } = await supabase
    .from("tools")
    .select("*, translations:tool_translations(*)")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    console.warn("[cms] Falling back to local tools:", error?.message);
    return fallbackTools(locale);
  }

  const tools = (data as unknown as PublishedTool[]).filter(
    (tool) =>
      isRegisteredSlug(tool.slug) && isToolAvailableInLocale(tool.slug, locale),
  );

  const dict = await getDictionary(locale);

  const cards = tools.map((tool) => {
    const exact = (tool.translations ?? []).find((t) => t.locale === locale);
    const labels = dictLabels(tool.slug, dict);
    const en = pickTranslation(tool.translations ?? [], locale);
    return {
      slug: tool.slug,
      title: exact?.title ?? labels?.title ?? en?.title ?? tool.slug,
      description:
        exact?.short_description ??
        labels?.description ??
        en?.short_description ??
        "",
      coverUrl: publicMediaUrl(tool.cover_path),
      sortOrder: tool.sort_order,
      category: resolveCategory(tool.category, tool.slug),
    } satisfies CmsToolCard;
  });

  return cards.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title);
  });
}

/**
 * A single published tool page. When Supabase is reachable and the tool is
 * a draft or missing, this returns null (no silent fallback to offline
 * copy) — publishing status is authoritative. Only unreachable/failing
 * Supabase falls back to the bundled registry/dictionary copy.
 */
export async function getPublishedTool(
  slug: string,
  locale: Locale,
): Promise<CmsToolPage | null> {
  if (!isRegisteredSlug(slug)) return null;
  if (!isToolAvailableInLocale(slug, locale)) return null;

  const supabase = getBuildClient();
  if (!supabase) return offlineTool(slug, locale);

  const { data, error } = await supabase
    .from("tools")
    .select("*, translations:tool_translations(*)")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.warn("[cms] Falling back to local tool:", error.message);
    return offlineTool(slug, locale);
  }

  if (!data || (data as unknown as PublishedTool).status !== "published") {
    // Supabase is reachable and authoritative: drafts/missing tools are not published.
    return null;
  }

  const tool = data as unknown as PublishedTool;
  const exact = (tool.translations ?? []).find((t) => t.locale === locale);
  const en = pickTranslation(tool.translations ?? [], locale);
  const dict = await getDictionary(locale);
  const labels = dictLabels(tool.slug, dict);

  const tr = exact ?? en;
  if (!tr && !labels) return null;

  return {
    slug: tool.slug,
    title: exact?.title ?? labels?.title ?? en?.title ?? tool.slug,
    description:
      exact?.short_description ?? labels?.description ?? en?.short_description ?? "",
    seoTitle:
      exact?.seo_title || exact?.title || labels?.seoTitle || en?.seo_title || en?.title || tool.slug,
    seoDescription:
      exact?.seo_description ||
      exact?.short_description ||
      labels?.seoDescription ||
      en?.seo_description ||
      en?.short_description ||
      "",
    content: exact?.content ?? null,
    coverUrl: publicMediaUrl(tool.cover_path),
    category: resolveCategory(tool.category, tool.slug),
    faqs: parseFaqs(exact?.faqs ?? en?.faqs),
    howtoSteps: parseHowtoSteps(exact?.howto_steps ?? en?.howto_steps),
  };
}

export const LOGO_SETTING_KEY = "logo_path";
export const FAVICON_SETTING_KEY = "favicon_path";
export const SITE_NAME_SETTING_KEY = "site_name";
export const SITE_TAGLINE_SETTING_KEY = "site_tagline";
export const MAINTENANCE_MESSAGE_SETTING_KEY = "maintenance_message";

export type SiteSettings = {
  siteName: string;
  siteTagline: string;
  logoPath: string | null;
  faviconPath: string | null;
  maintenanceMessage: string;
};

function settingValue(
  rows: { key: string; translations?: { value: string; locale: string }[] }[],
  key: string,
  locale: Locale = "en",
): string {
  const row = rows.find((item) => item.key === key);
  const translations = row?.translations ?? [];
  return (
    translations.find((t) => t.locale === locale)?.value ??
    translations.find((t) => t.locale === "en")?.value ??
    translations[0]?.value ??
    ""
  );
}

/** Typed public site settings (allowlisted keys only). */
export async function getSiteSettings(
  locale: Locale = "en",
): Promise<SiteSettings> {
  const supabase = getBuildClient();
  if (!supabase) {
    return {
      siteName: "",
      siteTagline: "",
      logoPath: null,
      faviconPath: null,
      maintenanceMessage: "",
    };
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("key, translations:site_setting_translations(value, locale)")
    .in("key", [
      SITE_NAME_SETTING_KEY,
      SITE_TAGLINE_SETTING_KEY,
      LOGO_SETTING_KEY,
      FAVICON_SETTING_KEY,
      MAINTENANCE_MESSAGE_SETTING_KEY,
    ]);

  if (error || !data) {
    return {
      siteName: "",
      siteTagline: "",
      logoPath: null,
      faviconPath: null,
      maintenanceMessage: "",
    };
  }

  const rows = data as unknown as {
    key: string;
    translations?: { value: string; locale: string }[];
  }[];

  const logoPath = settingValue(rows, LOGO_SETTING_KEY, locale) || null;
  const faviconPath = settingValue(rows, FAVICON_SETTING_KEY, locale) || null;

  return {
    siteName: settingValue(rows, SITE_NAME_SETTING_KEY, locale),
    siteTagline: settingValue(rows, SITE_TAGLINE_SETTING_KEY, locale),
    logoPath,
    faviconPath,
    maintenanceMessage: settingValue(
      rows,
      MAINTENANCE_MESSAGE_SETTING_KEY,
      locale,
    ),
  };
}

/**
 * Load a tool for signed draft preview. Does not require published status.
 * Uses the service-role client so draft rows bypass public RLS. Caller must
 * already have verified a preview token (or an admin session).
 */
export async function getToolForPreview(
  slug: string,
  locale: Locale,
): Promise<CmsToolPage | null> {
  if (!isRegisteredSlug(slug)) return null;
  if (!isToolAvailableInLocale(slug, locale)) return null;

  const { createSupabaseServiceClient } = await import("@/lib/supabase/service");
  const supabase = createSupabaseServiceClient() ?? getBuildClient();
  if (!supabase) return offlineTool(slug, locale);

  const { data, error } = await supabase
    .from("tools")
    .select("*, translations:tool_translations(*)")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return offlineTool(slug, locale);
  }

  const tool = data as unknown as PublishedTool;
  const exact = (tool.translations ?? []).find((t) => t.locale === locale);
  const en = pickTranslation(tool.translations ?? [], locale);
  const dict = await getDictionary(locale);
  const labels = dictLabels(tool.slug, dict);
  const tr = exact ?? en;
  if (!tr && !labels) return null;

  return {
    slug: tool.slug,
    title: exact?.title ?? labels?.title ?? en?.title ?? tool.slug,
    description:
      exact?.short_description ?? labels?.description ?? en?.short_description ?? "",
    seoTitle:
      exact?.seo_title || exact?.title || labels?.seoTitle || en?.seo_title || en?.title || tool.slug,
    seoDescription:
      exact?.seo_description ||
      exact?.short_description ||
      labels?.seoDescription ||
      en?.seo_description ||
      en?.short_description ||
      "",
    content: exact?.content ?? null,
    coverUrl: publicMediaUrl(tool.cover_path),
    category: resolveCategory(tool.category, tool.slug),
    faqs: parseFaqs(exact?.faqs ?? en?.faqs),
    howtoSteps: parseHowtoSteps(exact?.howto_steps ?? en?.howto_steps),
  };
}

/** Public URL of the uploaded site logo, or null when none is set. */
export async function getSiteLogoUrl(): Promise<string | null> {
  const settings = await getSiteSettings();
  return publicMediaUrl(settings.logoPath);
}

/** Public URL of the uploaded favicon, or null when none is set. */
export async function getSiteFaviconUrl(): Promise<string | null> {
  const settings = await getSiteSettings();
  return publicMediaUrl(settings.faviconPath);
}

/**
 * Slugs eligible for sitemap/static-params generation. Only published CMS
 * slugs (intersected with the registry allowlist) when the DB is reachable;
 * every registered slug otherwise (offline mode).
 */
export async function getPublishedSlugs(): Promise<string[]> {
  const supabase = getBuildClient();
  if (!supabase) return toolRegistry.map((t) => t.slug);

  const { data, error } = await supabase
    .from("tools")
    .select("slug")
    .eq("status", "published");

  if (error || !data) {
    console.warn("[cms] Falling back to registry slugs:", error?.message);
    return toolRegistry.map((t) => t.slug);
  }

  // Tool executables live in the registry; CMS cannot invent unknown slugs.
  return (data as { slug: string }[])
    .map((row) => row.slug)
    .filter(isRegisteredSlug);
}

/**
 * Resolved AdSense config for the current request: CMS `site_settings`
 * values (when Supabase is reachable) merged over env/hardcoded defaults.
 */
export async function getAdSenseConfig(): Promise<AdSenseConfig> {
  const supabase = getBuildClient();
  if (!supabase) return resolveAdSenseConfig();

  const keys = Object.values(ADSENSE_SETTING_KEYS);
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, translations:site_setting_translations(value, locale)")
    .in("key", keys);

  if (error || !data) {
    console.warn("[cms] Falling back to default AdSense config:", error?.message);
    return resolveAdSenseConfig();
  }

  const rows = data as unknown as {
    key: string;
    translations?: { value: string; locale: string }[];
  }[];

  const valueOf = (key: string): string | null => {
    const translations = rows.find((r) => r.key === key)?.translations ?? [];
    return (
      translations.find((t) => t.locale === "en")?.value ??
      translations[0]?.value ??
      null
    );
  };

  const toBool = (value: string | null, fallback: boolean): boolean =>
    value === null ? fallback : value === "true";

  return resolveAdSenseConfig({
    enabled: toBool(valueOf(ADSENSE_SETTING_KEYS.enabled), true),
    clientId: valueOf(ADSENSE_SETTING_KEYS.clientId),
    slots: {
      top: valueOf(ADSENSE_SETTING_KEYS.slotTop),
      sidebar: valueOf(ADSENSE_SETTING_KEYS.slotSidebar),
      bottom: valueOf(ADSENSE_SETTING_KEYS.slotBottom),
      toolInline: valueOf(ADSENSE_SETTING_KEYS.slotToolInline),
    },
    placements: {
      top: toBool(valueOf(ADSENSE_SETTING_KEYS.placementTop), true),
      sidebar: toBool(valueOf(ADSENSE_SETTING_KEYS.placementSidebar), true),
      bottom: toBool(valueOf(ADSENSE_SETTING_KEYS.placementBottom), true),
      toolInline: toBool(valueOf(ADSENSE_SETTING_KEYS.placementToolInline), true),
    },
  });
}

export { MEDIA_BUCKET, publicMediaUrl };
