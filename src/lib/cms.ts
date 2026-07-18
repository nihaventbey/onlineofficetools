import { createClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n";
import type { Database, PublishedTool, ToolTranslationRow } from "@/lib/supabase/types";

export type CmsToolCard = {
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  sortOrder: number;
};

export type CmsToolPage = {
  slug: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  content: string | null;
  coverUrl: string | null;
};

const MEDIA_BUCKET = "cms-media";

function getBuildClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }

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

/** Fallback when Supabase is not configured (local/dev without CMS). */
function fallbackTools(locale: Locale): CmsToolCard[] {
  if (locale === "tr") {
    return [
      {
        slug: "word-counter",
        title: "Kelime Sayacı & Metin Dönüştürücü",
        description:
          "Kelime, karakter, satır ve cümleleri anında sayın. Tek tıkla büyük/küçük harf dönüştürün.",
        coverUrl: null,
        sortOrder: 0,
      },
    ];
  }

  return [
    {
      slug: "word-counter",
      title: "Word Counter & Text Converter",
      description:
        "Count words, characters, lines, and sentences instantly. Convert case with one click.",
      coverUrl: null,
      sortOrder: 0,
    },
  ];
}

export async function getPublishedTools(locale: Locale): Promise<CmsToolCard[]> {
  const supabase = getBuildClient();
  if (!supabase) {
    return fallbackTools(locale);
  }

  const { data, error } = await supabase
    .from("tools")
    .select("*, translations:tool_translations(*)")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    console.warn("[cms] Falling back to local tools:", error?.message);
    return fallbackTools(locale);
  }

  const tools = data as unknown as PublishedTool[];

  return tools.map((tool) => {
    const tr = pickTranslation(tool.translations ?? [], locale);
    return {
      slug: tool.slug,
      title: tr?.title ?? tool.slug,
      description: tr?.short_description ?? "",
      coverUrl: publicMediaUrl(tool.cover_path),
      sortOrder: tool.sort_order,
    };
  });
}

export async function getPublishedTool(
  slug: string,
  locale: Locale,
): Promise<CmsToolPage | null> {
  const supabase = getBuildClient();
  if (!supabase) {
    const cards = fallbackTools(locale);
    const card = cards.find((c) => c.slug === slug);
    if (!card) return null;
    return {
      slug: card.slug,
      title: card.title,
      description: card.description,
      seoTitle: card.title,
      seoDescription: card.description,
      content: null,
      coverUrl: null,
    };
  }

  const { data, error } = await supabase
    .from("tools")
    .select("*, translations:tool_translations(*)")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    const cards = fallbackTools(locale);
    const card = cards.find((c) => c.slug === slug);
    if (!card) return null;
    return {
      slug: card.slug,
      title: card.title,
      description: card.description,
      seoTitle: card.title,
      seoDescription: card.description,
      content: null,
      coverUrl: null,
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
  };
}

export async function getPublishedSlugs(): Promise<string[]> {
  const supabase = getBuildClient();
  if (!supabase) {
    return ["word-counter"];
  }

  const { data, error } = await supabase
    .from("tools")
    .select("slug")
    .eq("status", "published");

  if (error || !data?.length) {
    return ["word-counter"];
  }

  return data.map((row) => row.slug);
}

export { MEDIA_BUCKET, publicMediaUrl };
