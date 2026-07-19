import type { MetadataRoute } from "next";
import { getPublishedSlugs } from "@/lib/cms";
import { locales } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import { visibleCategories } from "@/lib/tools/categories";
import { isToolAvailableInLocale } from "@/lib/tools/registry";

const LEGAL = ["privacy", "terms", "about", "contact"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getPublishedSlugs();
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const locale of locales) {
    entries.push({
      url: absoluteUrl(`/${locale}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    });

    for (const page of LEGAL) {
      entries.push({
        url: absoluteUrl(`/${locale}/${page}`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.4,
      });
    }

    for (const category of visibleCategories(locale)) {
      entries.push({
        url: absoluteUrl(`/${locale}/categories/${category}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const slug of slugs) {
      if (!isToolAvailableInLocale(slug, locale)) continue;
      entries.push({
        url: absoluteUrl(`/${locale}/tools/${slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
