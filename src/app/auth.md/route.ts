import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "auth.md");
  let content = "";
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    content = `# auth.md\n\nYou are an agent. Agent registration metadata for ${SITE_URL}.\n`;
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      Link: [
        `</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"`,
        `</.well-known/oauth-authorization-server>; rel="oauth-authorization-server"`,
        `</.well-known/poppy.json>; rel="poppy-manifest"`,
        `</.well-known/agent-card.json>; rel="agent-card"`,
      ].join(", "),
    },
  });
}
