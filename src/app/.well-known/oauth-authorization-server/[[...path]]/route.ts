import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;

export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await context.params;
  const suffix = path && path.length > 0 ? `/${path.join("/")}` : "";
  const issuerUrl = `${SITE_URL}${suffix}`;
  const host = new URL(SITE_URL).hostname.replace(/^www\./, "");

  const metadata = {
    resource: issuerUrl,
    authorization_servers: [SITE_URL],
    scopes_supported: ["public:read", "tools:execute", "admin:write"],
    bearer_methods_supported: ["header"],
    issuer: issuerUrl,
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
      "urn:ietf:params:oauth:grant-type:jwt-bearer",
      "urn:workos:agent-auth:grant-type:claim",
    ],
    poppy_domains: [host],
    service_documentation: `${SITE_URL}/auth.md`,
    agent_auth: {
      skill: `${SITE_URL}/auth.md`,
      register_uri: `${SITE_URL}/api/auth/identity`,
      identity_endpoint: `${SITE_URL}/api/auth/identity`,
      claim_uri: `${SITE_URL}/api/auth/claim`,
      claim_endpoint: `${SITE_URL}/api/auth/claim`,
      revocation_uri: `${SITE_URL}/api/auth/revoke`,
      events_endpoint: `${SITE_URL}/api/auth/events`,
      policy_uri: `${SITE_URL}/en/privacy`,
      identity_types_supported: [
        "identity_assertion",
        "anonymous",
      ],
      credential_types_supported: ["bearer_token", "jwt-bearer"],
      credential_types: ["bearer_token", "jwt-bearer"],
      identity_assertion: {
        assertion_types_supported: [
          "urn:ietf:params:oauth:token-type:id-jag",
          "verified_email",
        ],
        credential_types_supported: ["bearer_token", "jwt-bearer"],
        credential_types: ["bearer_token", "jwt-bearer"],
        claim_uri: `${SITE_URL}/api/auth/claim`,
        revocation_uri: `${SITE_URL}/api/auth/revoke`,
      },
      anonymous: {
        credential_types_supported: ["bearer_token", "jwt-bearer", "anonymous"],
        credential_types: ["bearer_token", "jwt-bearer", "anonymous"],
        claim_uri: `${SITE_URL}/api/auth/claim`,
      },
      events_supported: [
        "https://schemas.workos.com/events/agent/auth/identity/assertion/revoked",
      ],
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
