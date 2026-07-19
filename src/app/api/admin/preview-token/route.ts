import { NextResponse } from "next/server";
import { createPreviewToken } from "@/lib/preview-token";
import { getAdminUser } from "@/lib/supabase/requireAdminUser";

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { toolId?: string; slug?: string };
  try {
    body = (await request.json()) as { toolId?: string; slug?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.toolId || !body.slug) {
    return NextResponse.json({ error: "toolId and slug required" }, { status: 400 });
  }

  const token = createPreviewToken(body.toolId, body.slug);
  return NextResponse.json({
    token,
    url: `/en/tools/${body.slug}/preview?token=${encodeURIComponent(token)}`,
  });
}
