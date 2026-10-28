import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const host = new URL(SITE_URL).hostname.replace(/^www\./, "");

  const metadata = {
    issuer: SITE_URL,
    authorization_endpoint: `${SITE_URL}/api/auth/authorize`,
    token_endpoint: `${SITE_URL}/api/auth/token`,
    revocation_endpoint: `${SITE_URL}/api/auth/revoke`,
    device_authorization_endpoint: `${SITE_URL}/api/auth/device`,
    jwks_uri: `${SITE_URL}/.well-known/jwks.json`,
    response_types_supported: ["code", "token"],
    grant_types_supported: [
      "authorization_code",
      "refresh_token",
      "client_credentials",
      "urn:ietf:params:oauth:grant-type:device_code",
    ],
    poppy_domains: [host],
    service_documentation: `${SITE_URL}/auth.md`,
    agent_auth: {
      register_uri: `${SITE_URL}/auth.md`,
      supported_identity_types: ["agent", "user", "service"],
      credential_types: ["bearer_token", "anonymous"],
      revocation_uri: `${SITE_URL}/api/auth/revoke`,
      claim_uri: `${SITE_URL}/auth.md#claims`,
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
