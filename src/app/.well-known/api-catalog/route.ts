import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const linkset = [
    {
      anchor: `${SITE_URL}/api`,
      "service-desc": [
        {
          href: `${SITE_URL}/.well-known/ai-catalog.json`,
          type: "application/json",
        },
      ],
      "service-doc": [
        {
          href: `${SITE_URL}/en`,
          type: "text/html",
        },
      ],
      status: [
        {
          href: `${SITE_URL}/api/health`,
          type: "application/json",
        },
      ],
    },
    {
      anchor: `${SITE_URL}/.well-known/mcp/server-card.json`,
      "service-desc": [
        {
          href: `${SITE_URL}/.well-known/mcp/server-card.json`,
          type: "application/json",
        },
      ],
      "service-doc": [
        {
          href: `${SITE_URL}/auth.md`,
          type: "text/markdown",
        },
      ],
    },
    {
      anchor: `${SITE_URL}/.well-known/agent-skills/index.json`,
      "service-desc": [
        {
          href: `${SITE_URL}/.well-known/agent-skills/index.json`,
          type: "application/json",
        },
      ],
    },
  ];

  return new NextResponse(JSON.stringify({ linkset }, null, 2), {
    headers: {
      "Content-Type": "application/linkset+json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
