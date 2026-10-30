import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export async function POST() {
  return NextResponse.json(
    {
      claim_attempt: {
        user_code: "OOT-2026",
        expires_in: 600,
        verification_uri: `${SITE_URL}/auth.md#claims`,
        interval: 5,
      },
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
