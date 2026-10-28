import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export async function GET() {
  return NextResponse.redirect(`${SITE_URL}/auth.md`, 307);
}
