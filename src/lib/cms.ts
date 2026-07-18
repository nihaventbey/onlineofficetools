import { createClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n";
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

function fallbackTools(locale: Locale): CmsToolCard[] {
  return toolRegistry.map((tool, index) => {
    // Titles come from dictionaries at render time for fallback; keep English defaults here for CMS-less builds.
    const titles: Record<string, { en: string; tr: string; enDesc: string; trDesc: string }> = {
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
      "password-generator": {
        en: "Password Generator",
        tr: "Şifre Üretici",
        enDesc: "Generate strong passwords with Web Crypto in your browser.",
        trDesc: "Web Crypto ile tarayıcınızda güçlü şifreler üretin.",
      },
    };
    const meta = titles[tool.slug];
    return {
      slug: tool.slug,
      title: locale === "tr" ? meta.tr : meta.en,
      description: locale === "tr" ? meta.trDesc : meta.enDesc,
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
  if (category === "developer" || category === "security" || category === "text") {
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

  if (!tools.length) return fallbackTools(locale);

  return tools.map((tool) => {
    const tr = pickTranslation(tool.translations ?? [], locale);
    return {
      slug: tool.slug,
      title: tr?.title ?? tool.slug,
      description: tr?.short_description ?? "",
      coverUrl: publicMediaUrl(tool.cover_path),
      sortOrder: tool.sort_order,
      category: withRegistryCategory(tool.slug, tool.category),
    };
  });
}

export async function getPublishedTool(
  slug: string,
  locale: Locale,
): Promise<CmsToolPage | null> {
  if (!isRegisteredSlug(slug)) return null;

  const supabase = getBuildClient();
  if (!supabase) {
    const card = fallbackTools(locale).find((c) => c.slug === slug);
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
    const card = fallbackTools(locale).find((c) => c.slug === slug);
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
  const tr = pickTranslation(tool.translations ?? [], locale);
  if (!tr) return null;

  return {
    slug: tool.slug,
    title: tr.title,
    description: tr.short_description,
    seoTitle: tr.seo_title || tr.title,
    seoDescription: tr.seo_description || tr.short_description,
    content: tr.content,
    coverUrl: publicMediaUrl(tool.cover_path),
    category: withRegistryCategory(tool.slug, tool.category),
  };
}

export async function getPublishedSlugs(): Promise<string[]> {
  const supabase = getBuildClient();
  if (!supabase) return toolRegistry.map((t) => t.slug);

  const { data, error } = await supabase
    .from("tools")
    .select("slug")
    .eq("status", "published");

  if (error || !data?.length) return toolRegistry.map((t) => t.slug);

  return data.map((row) => row.slug).filter(isRegisteredSlug);
}

export { MEDIA_BUCKET, publicMediaUrl };
