import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const host = new URL(SITE_URL).hostname.replace(/^www\./, "");

  const manifest = {
    protocol_version: "0.1",
    organization: {
      name: "Online Office Tools",
      domain: host,
    },
    auth: {
      issuer: SITE_URL,
    },
    apis: [
      {
        type: "openapi",
        url: `${SITE_URL}/.well-known/api-catalog`,
        description:
          "Online Office Tools API Catalog and Agent Discovery Endpoints",
      },
    ],
    web: {
      home_url: `${SITE_URL}/en`,
    },
  };

  return new NextResponse(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
