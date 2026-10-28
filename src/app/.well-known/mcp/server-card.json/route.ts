import { NextResponse } from "next/server";
import { toolMetaList } from "@/lib/tools/metadata";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const tools = toolMetaList.map((t) => ({
    name: t.slug.replace(/-/g, "_"),
    description: `Execute or link to ${t.slug} (${t.category}). Input formats: ${(t.accepts ?? ["any"]).join(", ")}.`,
    inputSchema: {
      type: "object",
      properties: {
        locale: {
          type: "string",
          enum: ["en", "tr", "de", "fr", "es", "it", "pt", "ru"],
          default: "en",
        },
      },
    },
    url: `${SITE_URL}/en/tools/${t.slug}`,
  }));

  const card = {
    $schema: "https://modelcontextprotocol.io/schemas/server-card/v1.json",
    serverInfo: {
      name: "onlineofficetools-mcp",
      version: "1.0.0",
      description:
        "Privacy-first client-side office utilities for PDF, images, video, spreadsheets, and developer tools.",
      websiteUrl: SITE_URL,
    },
    transport: {
      type: "http",
      endpoint: `${SITE_URL}/api`,
    },
    capabilities: {
      tools: {
        listChanged: false,
      },
      resources: {
        subscribe: false,
        listChanged: false,
      },
    },
    tools,
  };

  return new NextResponse(JSON.stringify(card, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
