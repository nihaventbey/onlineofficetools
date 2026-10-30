import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // Default to anonymous registration if no JSON payload provided
  }

  const registrationType =
    typeof body.type === "string" ? body.type : "anonymous";
  const expires = new Date(Date.now() + 3600 * 1000).toISOString();

  return NextResponse.json(
    {
      registration_id: "reg_oot_public_agent",
      registration_type: registrationType,
      identity_assertion: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpc3MiOiJodHRwczovL29ubGluZW9mZmljZXRvb2xzLmNvbSIsInN1YiI6ImFnZW50X2Fub255bW91cyIsInNjb3BlIjoicHVibGljOnJlYWQgdG9vbHM6ZXhlY3V0ZSJ9.",
      assertion_expires: expires,
      claim_url: `${SITE_URL}/api/auth/claim`,
      claim_token: "clm_oot_public_agent",
      claim_token_expires: expires,
      scopes: ["public:read", "tools:execute"],
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
