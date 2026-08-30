import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/requireAdminUser";
import { locales } from "@/lib/i18n";

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { slug?: string; category?: string };
  try {
    body = (await request.json()) as { slug?: string; category?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { slug, category } = body;

  try {
    // Revalidate sitemap
    revalidatePath("/sitemap.xml");

    // Revalidate tool pages across all locales
    if (slug) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/tools/${slug}`);
        revalidatePath(`/${locale}`);
      }
    }

    // Revalidate category pages across all locales
    if (category) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/categories/${category}`);
      }
    }

    return NextResponse.json({ ok: true, revalidated: { slug, category } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Revalidation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
