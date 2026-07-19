import { getSiteFaviconUrl, getSiteLogoUrl, getSiteSettings } from "@/lib/cms";
import type { Locale } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 } as const;

/**
 * Fetch an image and return it as a base64 data URI so Satori embeds it
 * without extra I/O. Works for SVG too (Satori supports SVG data URIs).
 */
async function toDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    let mime = (res.headers.get("content-type") ?? "").split(";")[0]!.trim();
    if (!mime || mime === "application/octet-stream") {
      if (/\.svg(\?|#|$)/i.test(url)) mime = "image/svg+xml";
      else if (/\.png(\?|#|$)/i.test(url)) mime = "image/png";
      else if (/\.jpe?g(\?|#|$)/i.test(url)) mime = "image/jpeg";
      else if (/\.webp(\?|#|$)/i.test(url)) mime = "image/webp";
      else return null;
    }
    if (!mime.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.byteLength) return null;
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Resolve the site logo for next/og as a data URI.
 * Prefers CMS logo, then CMS favicon, then the bundled app icon.
 */
export async function resolveOgLogoSrc(): Promise<string> {
  const [logoUrl, faviconUrl] = await Promise.all([
    getSiteLogoUrl(),
    getSiteFaviconUrl(),
  ]);
  for (const candidate of [logoUrl, faviconUrl]) {
    if (!candidate) continue;
    const dataUri = await toDataUri(candidate);
    if (dataUri) return dataUri;
  }
  return (
    (await toDataUri(absoluteUrl("/icon-512.png"))) ??
    absoluteUrl("/icon-512.png")
  );
}

export async function getOgBrandName(locale: Locale = "en"): Promise<string> {
  const settings = await getSiteSettings(locale);
  return settings.siteName?.trim() || "Online Office Tools";
}
