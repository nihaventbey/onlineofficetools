import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const index = {
    $schema: "https://agentskills.io/schemas/v0.2.0/index.json",
    version: "0.2.0",
    skills: [
      {
        name: "online-office-tools",
        type: "skill",
        description:
          "Client-side document, PDF, media, and office conversion tools running privately in the browser.",
        url: `${SITE_URL}/.well-known/agent-skills/office-tools/SKILL.md`,
        digest:
          "sha256:124f53ba1481923b5569932cc26c531c9212eea4c49fd5538b8a6ef8223ebcaf",
      },
    ],
  };

  return new NextResponse(JSON.stringify(index, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
