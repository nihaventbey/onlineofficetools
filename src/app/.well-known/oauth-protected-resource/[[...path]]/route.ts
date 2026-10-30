import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;

export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await context.params;
  const suffix = path && path.length > 0 ? `/${path.join("/")}` : "";
  const resourceUrl = `${SITE_URL}${suffix}`;

  const metadata = {
    resource: resourceUrl,
    resource_name: "Online Office Tools",
    resource_logo_uri: `${SITE_URL}/logo.png`,
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
