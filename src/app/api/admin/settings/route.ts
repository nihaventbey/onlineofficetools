import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/requireAdminUser";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  FAVICON_SETTING_KEY,
  LOGO_SETTING_KEY,
  MAINTENANCE_MESSAGE_SETTING_KEY,
  SITE_NAME_SETTING_KEY,
  SITE_TAGLINE_SETTING_KEY,
} from "@/lib/cms";

const ALLOWED_KEYS = new Set([
  LOGO_SETTING_KEY,
  FAVICON_SETTING_KEY,
  SITE_NAME_SETTING_KEY,
  SITE_TAGLINE_SETTING_KEY,
  MAINTENANCE_MESSAGE_SETTING_KEY,
]);

const BRANDING_PREFIX_BY_KEY = new Map([
  [LOGO_SETTING_KEY, "branding/logo-"],
  [FAVICON_SETTING_KEY, "branding/favicon-"],
]);

/**
 * Admin-only settings upsert. Uses the service-role client so writes succeed
 * even when the browser JWT's app_metadata claim is stale, while still
 * requiring a verified admin session first.
 */
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createSupabaseServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Service role not configured" },
      { status: 500 },
    );
  }

  let body: { key?: string; value?: string | null };
  try {
    body = (await request.json()) as { key?: string; value?: string | null };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.key || !ALLOWED_KEYS.has(body.key)) {
    return NextResponse.json({ error: "Invalid setting key" }, { status: 400 });
  }

  const key = body.key;
  const value =
    body.value === null || body.value === undefined
      ? null
      : String(body.value).trim() || null;
  const requiredPrefix = BRANDING_PREFIX_BY_KEY.get(key);
  if (
    requiredPrefix &&
    value !== null &&
    (!value.startsWith(requiredPrefix) || value.includes(".."))
  ) {
    return NextResponse.json(
      { error: "Invalid branding asset path" },
      { status: 400 },
    );
  }

  const { data: existing, error: selectError } = await service
    .from("site_settings")
    .select("id")
    .eq("key", key)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  let settingId = existing?.id ?? null;
  if (!settingId) {
    const { data: inserted, error: insertError } = await service
      .from("site_settings")
      .insert({ key })
      .select("id")
      .single();
    if (insertError || !inserted) {
      return NextResponse.json(
        { error: insertError?.message ?? "Could not create setting" },
        { status: 500 },
      );
    }
    settingId = inserted.id;
  }

  if (value === null) {
    const { error: deleteError } = await service
      .from("site_setting_translations")
      .delete()
      .eq("setting_id", settingId);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  } else {
    const { data: existingTr } = await service
      .from("site_setting_translations")
      .select("id")
      .eq("setting_id", settingId)
      .eq("locale", "en")
      .maybeSingle();

    const write = existingTr
      ? service
          .from("site_setting_translations")
          .update({ value })
          .eq("id", existingTr.id)
      : service
          .from("site_setting_translations")
          .insert({ setting_id: settingId, locale: "en", value });

    const { error: writeError } = await write;
    if (writeError) {
      return NextResponse.json({ error: writeError.message }, { status: 500 });
    }
  }

  // Invalidate site layouts so the new logo/settings appear promptly.
  revalidatePath("/", "layout");
  for (const lang of ["en", "tr", "de", "fr", "es", "it", "pt", "ru"]) {
    revalidatePath(`/${lang}`, "layout");
  }

  return NextResponse.json({ ok: true, key, value });
}
