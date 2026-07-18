import type { MetadataRoute } from "next";
import { getPublishedSlugs } from "@/lib/cms";
import { locales } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

const LEGAL = ["privacy", "terms", "about", "contact"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getPublishedSlugs();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push({
      url: absoluteUrl(`/${locale}`),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    });

    for (const page of LEGAL) {
      entries.push({
        url: absoluteUrl(`/${locale}/${page}`),
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.4,
      });
    }

    for (const slug of slugs) {
      entries.push({
        url: absoluteUrl(`/${locale}/tools/${slug}`),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
