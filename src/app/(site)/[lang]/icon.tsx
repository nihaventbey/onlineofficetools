import { ImageResponse } from "next/og";
import { locales } from "@/lib/i18n";
import { resolveFaviconSrc } from "@/lib/og";

// Rendered as PNG so Safari and Google Search accept it (SVG favicons are not
// universally supported).
export const size = { width: 48, height: 48 };
export const contentType = "image/png";
export const revalidate = 3600;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Icon() {
  const src = await resolveFaviconSrc();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          width={48}
          height={48}
          alt=""
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { ...size },
  );
}
