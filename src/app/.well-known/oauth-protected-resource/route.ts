import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const metadata = {
    resource: SITE_URL,
    authorization_servers: [SITE_URL],
    scopes_supported: ["public:read", "tools:execute", "admin:write"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${SITE_URL}/auth.md`,
  };

  return new NextResponse(JSON.stringify(metadata, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
