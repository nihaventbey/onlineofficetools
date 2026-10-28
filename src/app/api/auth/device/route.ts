import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export async function POST() {
  return NextResponse.json(
    {
      device_code: "onlineofficetools-device-code",
      user_code: "OOT-2026",
      verification_uri: `${SITE_URL}/auth.md`,
      expires_in: 1800,
      interval: 5,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    },
  );
}
