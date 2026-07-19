import { ImageResponse } from "next/og";
import { getPublishedSlugs, getPublishedTool } from "@/lib/cms";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { getOgBrandName, OG_SIZE, resolveOgLogoSrc } from "@/lib/og";
import { categoryStyles } from "@/lib/tools/categories";
import { getToolBySlug } from "@/lib/tools/registry";

export const alt = "Online Office Tools";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 60;

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return locales.flatMap((lang) =>
    slugs
      .filter((slug) => {
        const meta = getToolBySlug(slug);
        if (!meta?.locales?.length) return true;
        return meta.locales.includes(lang);
      })
      .map((slug) => ({ lang, slug })),
  );
}

export default async function ToolOgImage({ params }: Props) {
  const { lang, slug } = await params;
  const locale = (isLocale(lang) ? lang : "en") as Locale;
  const reg = getToolBySlug(slug);
  const dict = await getDictionary(locale);
  const cms = await getPublishedTool(slug, locale);
  const labels = reg ? dict.tools[reg.dictKey] : null;
  const title = cms?.title || labels?.title || slug;
  const description =
    cms?.description || labels?.description || dict.common.siteTagline;
  const category = cms?.category ?? reg?.category ?? "text";
  const styles = categoryStyles[category];
  const emoji = reg?.emoji ?? "🛠️";
  const categoryLabel = dict.categories[category];
  const [logoSrc, brandName] = await Promise.all([
    resolveOgLogoSrc(),
    getOgBrandName(locale),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: `linear-gradient(135deg, ${styles.ogFrom} 0%, ${styles.ogTo} 70%)`,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 56,
                boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
              }}
            >
              {emoji}
            </div>
            <div
              style={{
                display: "flex",
                padding: "8px 16px",
                borderRadius: 999,
                background: "white",
                color: styles.ogAccent,
                fontSize: 22,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {categoryLabel}
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            width={88}
            height={88}
            alt=""
            style={{
              objectFit: "contain",
              borderRadius: 18,
              background: "white",
              padding: 10,
              boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.1,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, color: "#475569", maxWidth: 900 }}>
            {description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#64748b",
            fontSize: 22,
          }}
        >
          <span style={{ fontWeight: 700, color: styles.ogAccent }}>
            {brandName}
          </span>
          <span>{dict.common.trustOnDevice}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
