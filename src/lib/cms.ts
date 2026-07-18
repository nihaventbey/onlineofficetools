import { createClient } from "@supabase/supabase-js";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";
import type { Database, PublishedTool, ToolTranslationRow } from "@/lib/supabase/types";
import { getToolBySlug, isRegisteredSlug, toolRegistry } from "@/lib/tools/registry";
import type { ToolCategory } from "@/lib/tools/categories";

export type CmsToolCard = {
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  sortOrder: number;
  category: ToolCategory;
};

export type CmsToolPage = {
  slug: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  content: string | null;
  coverUrl: string | null;
  category: ToolCategory;
};

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
};

async function fallbackTools(locale: Locale): Promise<CmsToolCard[]> {
  const dict = await getDictionary(locale);
  return toolRegistry.map((tool, index) => {
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

function withRegistryCategory(
  slug: string,
  category: string | null,
): ToolCategory {
  const reg = getToolBySlug(slug);
  if (reg) return reg.category;
  if (
    category === "developer" ||
    category === "security" ||
    category === "text" ||
    category === "image" ||
    category === "calculator" ||
    category === "pdf" ||
    category === "documents" ||
    category === "spreadsheets" ||
    category === "presentations"
  ) {
    return category;
  }
  return "text";
}

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

  const tools = (data as unknown as PublishedTool[]).filter((tool) =>
    isRegisteredSlug(tool.slug),
  );

  const dict = await getDictionary(locale);
  const bySlug = new Map(
    tools.map((tool) => {
      const exact = (tool.translations ?? []).find((t) => t.locale === locale);
      const labels = dictLabels(tool.slug, dict);
      const en = pickTranslation(tool.translations ?? [], locale);
      return [
        tool.slug,
        {
          slug: tool.slug,
          title: exact?.title ?? labels?.title ?? en?.title ?? tool.slug,
          description:
            exact?.short_description ??
            labels?.description ??
            en?.short_description ??
            "",
          coverUrl: publicMediaUrl(tool.cover_path),
          sortOrder: tool.sort_order,
          category: withRegistryCategory(tool.slug, tool.category),
        } satisfies CmsToolCard,
      ] as const;
    }),
  );

  // Always expose every registered tool; CMS overlays metadata when present.
  const local = await fallbackTools(locale);
  return local.map((card, index) => {
    const cms = bySlug.get(card.slug);
    if (!cms) return { ...card, sortOrder: 1000 + index };
    return cms;
  });
}

export async function getPublishedTool(
  slug: string,
  locale: Locale,
): Promise<CmsToolPage | null> {
  if (!isRegisteredSlug(slug)) return null;

  const supabase = getBuildClient();
  if (!supabase) {
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
    };
  }

  const { data, error } = await supabase
    .from("tools")
    .select("*, translations:tool_translations(*)")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
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
    };
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
    category: withRegistryCategory(tool.slug, tool.category),
  };
}

export const LOGO_SETTING_KEY = "logo_path";

/** Public URL of the uploaded site logo, or null when none is set. */
export async function getSiteLogoUrl(): Promise<string | null> {
  const supabase = getBuildClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("site_settings")
    .select("key, translations:site_setting_translations(value, locale)")
    .eq("key", LOGO_SETTING_KEY)
    .maybeSingle();

  if (error || !data) return null;

  const translations =
    (data as unknown as { translations?: { value: string; locale: string }[] })
      .translations ?? [];
  const value =
    translations.find((t) => t.locale === "en")?.value ??
    translations[0]?.value ??
    null;

  return publicMediaUrl(value);
}

export async function getPublishedSlugs(): Promise<string[]> {
  // Tool executables live in the registry; CMS cannot invent unknown slugs.
  return toolRegistry.map((t) => t.slug);
}

export { MEDIA_BUCKET, publicMediaUrl };
