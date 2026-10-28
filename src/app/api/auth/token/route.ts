import { NextResponse } from "next/server";

export async function POST() {
  // Public agent token generation for client-side tool access
  return NextResponse.json(
    {
      access_token: "public_agent_anonymous",
      token_type: "Bearer",
      expires_in: 86400,
      scope: "public:read tools:execute",
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
