import { getToolBySlug, toolsByCategory } from "@/lib/tools/registry";
import { isToolCategory, toolCategories } from "@/lib/tools/categories";
import { isLocale } from "@/lib/locales";
import { SITE_URL } from "@/lib/site";

export function renderMarkdownForRequest(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0] || "en";
  const locale = isLocale(first) ? first : "en";
  const sub = isLocale(first) ? parts.slice(1) : parts;

  // 1. Tool Page: /[lang]/tools/[slug]
  if (sub[0] === "tools" && sub[1]) {
    const slug = sub[1];
    const meta = getToolBySlug(slug);
    if (meta) {
      const title = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      return [
        `# ${title} — Online Office Tool`,
        "",
        `> **Canonical URL:** ${SITE_URL}/${locale}/tools/${slug}`,
        `> **Category:** ${meta.category}`,
        `> **Input Formats:** ${(meta.accepts ?? ["None / Direct Input"]).join(", ")}`,
        `> **Output Formats:** ${(meta.outputs ?? ["Direct View / Download"]).join(", ")}`,
        "",
        "## Overview",
        `This tool is part of the Online Office Tools privacy-first suite. All processing executes 100% locally in the browser using WebAssembly, Web Crypto, and client-side JavaScript. No file or text data is sent to external servers.`,
        "",
        "## Keywords",
        meta.keywords.map((k: string) => `- ${k}`).join("\n"),
        "",
        "## Agent & Machine Interaction",
        `- **WebMCP:** This tool registers on \`document.modelContext\` as \`${slug.replace(/-/g, "_")}\`.`,
        `- **MCP Server Card:** ${SITE_URL}/.well-known/mcp/server-card.json`,
        `- **AI Catalog (ARD):** ${SITE_URL}/.well-known/ai-catalog.json`,
        `- **Next recommended tools:** ${(meta.nextSteps ?? []).map((s: string) => `[${s}](${SITE_URL}/${locale}/tools/${s})`).join(", ") || "None"}`,
      ].join("\n");
    }
  }

  // 2. Category Page: /[lang]/categories/[cat]
  if (sub[0] === "categories" && sub[1] && isToolCategory(sub[1])) {
    const cat = sub[1];
    const tools = toolsByCategory(cat);
    return [
      `# ${cat.toUpperCase()} Tools — Online Office Tools`,
      "",
      `> **Category:** ${cat}`,
      `> **Total Tools:** ${tools.length}`,
      "",
      "## Available Tools",
      tools
        .map(
          (t) =>
            `- [${t.slug}](${SITE_URL}/${locale}/tools/${t.slug}): ${t.keywords.slice(0, 3).join(", ")}`,
        )
        .join("\n"),
    ].join("\n");
  }

  // 3. Homepage / Global Index
  const categorySections = toolCategories
    .map((cat) => {
      const tools = toolsByCategory(cat);
      if (!tools.length) return "";
      const list = tools
        .map((t) => `  - [${t.slug}](${SITE_URL}/${locale}/tools/${t.slug})`)
        .join("\n");
      return `### ${cat.toUpperCase()} (${tools.length} tools)\n${list}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return [
    "# Online Office Tools — Agent-Ready Index",
    "",
    "Online Office Tools provides 60+ free, client-side, privacy-first office utilities for PDF, Word documents, Excel spreadsheets, images, audio, video, and developer tasks.",
    "",
    "## Machine & Agent Discovery Resources",
    `- **API Catalog (RFC 9727):** ${SITE_URL}/.well-known/api-catalog`,
    `- **ARD AI Catalog:** ${SITE_URL}/.well-known/ai-catalog.json`,
    `- **MCP Server Card (SEP-1649):** ${SITE_URL}/.well-known/mcp/server-card.json`,
    `- **Agent Skills Index:** ${SITE_URL}/.well-known/agent-skills/index.json`,
    `- **Authentication / Registration:** ${SITE_URL}/auth.md`,
    `- **Health Check:** ${SITE_URL}/api/health`,
    "",
    "## Tools Catalog by Category",
    categorySections,
    "",
    "## Privacy & Zero-Upload Guarantee",
    "All tools run entirely client-side inside the user's browser via WebAssembly and Canvas APIs. No document bytes are stored on the server.",
  ].join("\n");
}
