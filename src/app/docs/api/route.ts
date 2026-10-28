import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  return NextResponse.redirect(`${SITE_URL}/auth.md`, 308);
}
