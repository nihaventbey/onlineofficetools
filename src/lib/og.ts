import { getSiteFaviconUrl, getSiteLogoUrl, getSiteSettings } from "@/lib/cms";
import type { Locale } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 } as const;

async function isUsableRasterUrl(url: string): Promise<boolean> {
  if (/\.svg(\?|#|$)/i.test(url)) return false;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("svg") || ct.includes("xml")) return false;
    return (
      ct.startsWith("image/") ||
      /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(url)
    );
  } catch {
    return false;
  }
}

/**
 * Resolve a raster logo URL safe for next/og (Satori).
 * Prefers CMS logo, then favicon, then the bundled app icon.
 * SVG assets are skipped because Satori cannot render them reliably.
 */
export async function resolveOgLogoSrc(): Promise<string> {
  const [logoUrl, faviconUrl] = await Promise.all([
    getSiteLogoUrl(),
    getSiteFaviconUrl(),
  ]);
  for (const candidate of [logoUrl, faviconUrl]) {
    if (candidate && (await isUsableRasterUrl(candidate))) {
      return candidate;
    }
  }
  return absoluteUrl("/icon-512.png");
}

export async function getOgBrandName(locale: Locale = "en"): Promise<string> {
  const settings = await getSiteSettings(locale);
  return settings.siteName?.trim() || "Online Office Tools";
}
