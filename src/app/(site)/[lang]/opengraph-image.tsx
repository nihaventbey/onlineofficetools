import { ImageResponse } from "next/og";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { getOgBrandName, OG_SIZE, resolveOgLogoSrc } from "@/lib/og";

export const alt = "Online Office Tools";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 60;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type Props = { params: Promise<{ lang: string }> };

export default async function SiteOgImage({ params }: Props) {
  const { lang } = await params;
  const locale = (isLocale(lang) ? lang : "en") as Locale;
  const dict = await getDictionary(locale);
  const [logoSrc, brandName] = await Promise.all([
    resolveOgLogoSrc(),
    getOgBrandName(locale),
  ]);
  const tagline = dict.common.siteTagline;
  const description = dict.home.description;

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
          background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 55%, #e0f2fe 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            width={140}
            height={140}
            alt=""
            style={{
              objectFit: "contain",
              borderRadius: 28,
              background: "white",
              padding: 16,
              boxShadow: "0 12px 32px rgba(15,23,42,0.08)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.1,
              }}
            >
              {brandName}
            </div>
            <div style={{ fontSize: 28, color: "#2563eb", fontWeight: 600 }}>
              {tagline}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 32,
            color: "#475569",
            lineHeight: 1.35,
            maxWidth: 980,
          }}
        >
          {description}
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
          <span style={{ fontWeight: 700, color: "#2563eb" }}>
            onlineofficetools.com
          </span>
          <span>{dict.common.trustOnDevice}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
