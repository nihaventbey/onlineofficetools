import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const content = [
    "# robots.txt for onlineofficetools.com",
    "# Content Signals (https://contentsignals.org / draft-romm-aipref-contentsignals)",
    "Content-Signal: ai-train=no, search=yes, ai-input=yes",
    "",
    "# Search engine bots",
    "User-agent: Googlebot",
    "User-agent: Googlebot-Image",
    "User-agent: Bingbot",
    "User-agent: Slurp",
    "User-agent: DuckDuckBot",
    "User-agent: Baiduspider",
    "User-agent: YandexBot",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /admin/",
    "",
    "# AI and LLM search agents (allowed to crawl tools, documentation & catalog)",
    "User-agent: Google-Extended",
    "User-agent: GPTBot",
    "User-agent: ChatGPT-User",
    "User-agent: ClaudeBot",
    "User-agent: PerplexityBot",
    "User-agent: Applebot",
    "User-agent: Amazonbot",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /admin/",
    "",
    "# Default for all other crawlers",
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /admin/",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
    "# LLM context & documentation manifest",
    "# See: https://llmstxt.org",
    `# llms.txt: ${absoluteUrl("/llms.txt")}`,
  ].join("\n");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
