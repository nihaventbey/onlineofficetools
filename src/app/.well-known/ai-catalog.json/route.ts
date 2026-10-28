import { NextResponse } from "next/server";
import { toolMetaList } from "@/lib/tools/metadata";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const host = new URL(SITE_URL).hostname;

  const entries = toolMetaList.map((tool) => {
    const queries = [
      `free online ${tool.slug.replace(/-/g, " ")}`,
      `${tool.keywords.slice(0, 3).join(" ")} tool`,
      `how to use ${tool.slug.replace(/-/g, " ")} in browser`,
      `${tool.category} utility ${tool.slug.replace(/-/g, " ")}`,
    ];

    return {
      id: `urn:air:${host}:tool:${tool.slug}`,
      displayName: tool.slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      category: tool.category,
      type: "text/html",
      url: `${SITE_URL}/en/tools/${tool.slug}`,
      representativeQueries: queries,
      keywords: tool.keywords,
      accepts: tool.accepts ?? [],
      outputs: tool.outputs ?? [],
    };
  });

  const manifest = {
    $schema: "https://agenticresourcediscovery.org/schemas/v1/ai-catalog.json",
    specVersion: "1.0",
    host: {
      name: "Online Office Tools",
      domain: host,
      description:
        "Privacy-first, browser-based office utilities for PDF, documents, spreadsheets, images, video, audio, and developers.",
      url: SITE_URL,
    },
    entries,
  };

  return new NextResponse(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
