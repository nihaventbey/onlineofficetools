import { NextResponse } from "next/server";
import { toolMetaList } from "@/lib/tools/metadata";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const toolsByCategory: Record<string, typeof toolMetaList> = {};
  for (const tool of toolMetaList) {
    if (!toolsByCategory[tool.category]) {
      toolsByCategory[tool.category] = [];
    }
    toolsByCategory[tool.category].push(tool);
  }

  const sections: string[] = [
    `# Online Office Tools (onlineofficetools.com)`,
    `> Privacy-first, 100% in-browser office utilities. No server uploads, zero tracking of document contents, executing via client-side WebAssembly and modern web APIs.`,
    ``,
    `## Core Guarantees & Architecture`,
    `- **Zero File Uploads:** All PDF manipulation, image editing, video processing, audio extraction, and spreadsheet conversions run entirely client-side inside the user browser.`,
    `- **No Account Required:** Public tools require no authentication, API keys, or sign-up.`,
    `- **Multilingual:** Fully supported in 8 languages: English (en), Turkish (tr), German (de), French (fr), Spanish (es), Italian (it), Portuguese (pt), and Russian (ru).`,
    `- **Agent & LLM Friendly:** Provides Markdown content negotiation (Accept: text/markdown), MCP server card, ARD catalog, and Auth.md metadata.`,
    ``,
    `## Available Tools by Category`,
  ];

  for (const [category, tools] of Object.entries(toolsByCategory)) {
    sections.push(`### ${category.toUpperCase()}`);
    for (const tool of tools) {
      sections.push(
        `- [${tool.slug}](${SITE_URL}/en/tools/${tool.slug}): ${tool.keywords.join(", ")} (Accepts: ${(tool.accepts ?? ["text/files"]).join(", ")})`,
      );
    }
    sections.push(``);
  }

  sections.push(
    `## Discovery & Machine-Readable Endpoints`,
    `- [API Catalog](${SITE_URL}/.well-known/api-catalog): RFC 9727 API catalog`,
    `- [MCP Server Card](${SITE_URL}/.well-known/mcp/server-card.json): Model Context Protocol tools definition`,
    `- [Agent Skills](${SITE_URL}/.well-known/agent-skills/index.json): RFC v0.2.0 skills directory`,
    `- [Auth.md](${SITE_URL}/auth.md): Agent registration and OAuth metadata`,
    `- [Sitemap](${SITE_URL}/sitemap.xml): Full XML sitemap of all 700+ static URLs`,
  );

  return new NextResponse(sections.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
