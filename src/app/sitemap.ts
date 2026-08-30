import type { MetadataRoute } from "next";
import { getPublishedSlugs } from "@/lib/cms";
import { locales } from "@/lib/i18n";
import { absoluteUrl, languageAlternates } from "@/lib/site";
import { visibleCategories } from "@/lib/tools/categories";
import { isToolAvailableInLocale } from "@/lib/tools/registry";

export const revalidate = 86400;

const LEGAL = ["privacy", "terms", "about", "contact"] as const;
// Stable baseline timestamp to prevent Googlebot crawl storms caused by dynamic 'now' timestamps.
const STABLE_LAST_MODIFIED = new Date("2026-08-01T00:00:00.000Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getPublishedSlugs();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    // Homepage
    entries.push({
      url: absoluteUrl(`/${locale}`),
      lastModified: STABLE_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: languageAlternates("/"),
      },
    });

    // Legal / About pages
    for (const page of LEGAL) {
      entries.push({
        url: absoluteUrl(`/${locale}/${page}`),
        lastModified: STABLE_LAST_MODIFIED,
        changeFrequency: "monthly",
        priority: 0.4,
        alternates: {
          languages: languageAlternates(`/${page}`),
        },
      });
    }

    // Category pages
    for (const category of visibleCategories(locale)) {
      entries.push({
        url: absoluteUrl(`/${locale}/categories/${category}`),
        lastModified: STABLE_LAST_MODIFIED,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages: languageAlternates(`/categories/${category}`),
        },
      });
    }

    // Tool pages
    for (const slug of slugs) {
      if (!isToolAvailableInLocale(slug, locale)) continue;
      entries.push({
        url: absoluteUrl(`/${locale}/tools/${slug}`),
        lastModified: STABLE_LAST_MODIFIED,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: languageAlternates(`/tools/${slug}`),
        },
      });
    }
  }

  return entries;
}
