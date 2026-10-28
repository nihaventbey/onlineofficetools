import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const authServer = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`
    : `${SITE_URL}/api/auth`;

  const metadata = {
    issuer: authServer,
    authorization_endpoint: `${authServer}/authorize`,
    token_endpoint: `${authServer}/token`,
    jwks_uri: `${authServer}/.well-known/jwks.json`,
    response_types_supported: ["code", "token"],
    grant_types_supported: ["authorization_code", "refresh_token", "password"],
    service_documentation: `${SITE_URL}/auth.md`,
    agent_auth: {
      register_uri: `${SITE_URL}/auth.md`,
      supported_identity_types: ["agent", "user"],
      credential_types: ["bearer_token"],
      policy_uri: `${SITE_URL}/en/privacy`,
    },
  };

  return new NextResponse(JSON.stringify(metadata, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
