import { ImageResponse } from "next/og";
import { locales } from "@/lib/i18n";
import { resolveFaviconSrc } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const revalidate = 3600;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function AppleIcon() {
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
          background: "white",
          borderRadius: 36,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          width={150}
          height={150}
          alt=""
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { ...size },
  );
}
