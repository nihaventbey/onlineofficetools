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
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /admin/",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
  ].join("\n");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
