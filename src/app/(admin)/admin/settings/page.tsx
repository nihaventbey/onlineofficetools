"use client";

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LOGO_SETTING_KEY, MEDIA_BUCKET, publicMediaUrl } from "@/lib/cms";

export default function AdminSettingsPage() {
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadSettings = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("site_settings")
      .select("id, key, translations:site_setting_translations(value, locale)")
      .eq("key", LOGO_SETTING_KEY)
      .maybeSingle();
    setLoading(false);

    if (queryError) {
      setError(queryError.message);
      return;
    }

    const translations =
      (data as unknown as {
        translations?: { value: string; locale: string }[];
      } | null)?.translations ?? [];
    setLogoPath(
      translations.find((t) => t.locale === "en")?.value ??
        translations[0]?.value ??
        null,
    );
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function saveLogoPath(path: string | null) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setError(null);
    setSaved(false);

    const { data: existing, error: selectError } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", LOGO_SETTING_KEY)
      .maybeSingle();

    if (selectError) {
      setError(selectError.message);
      return;
    }

    let settingId = existing?.id ?? null;
    if (!settingId) {
      const { data: inserted, error: insertError } = await supabase
        .from("site_settings")
        .insert({ key: LOGO_SETTING_KEY })
        .select("id")
        .single();
      if (insertError || !inserted) {
        setError(insertError?.message ?? "Could not create setting.");
        return;
      }
      settingId = inserted.id;
    }

    if (path === null) {
      const { error: deleteError } = await supabase
        .from("site_setting_translations")
        .delete()
        .eq("setting_id", settingId);
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
    } else {
      const { data: existingTr } = await supabase
        .from("site_setting_translations")
        .select("id")
        .eq("setting_id", settingId)
        .eq("locale", "en")
        .maybeSingle();

      const write = existingTr
        ? supabase
            .from("site_setting_translations")
            .update({ value: path })
            .eq("id", existingTr.id)
        : supabase
            .from("site_setting_translations")
            .insert({ setting_id: settingId, locale: "en", value: path });

      const { error: writeError } = await write;
      if (writeError) {
        setError(writeError.message);
        return;
      }
    }

    setLogoPath(path);
    setSaved(true);
  }

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setBusy(true);
    setError(null);

    const ext = file.name.split(".").pop() ?? "png";
    const path = `branding/logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      setBusy(false);
      setError(uploadError.message);
      return;
    }

    await saveLogoPath(path);
    setBusy(false);
    event.target.value = "";
  }

  async function onRemove() {
    if (!logoPath) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setError(null);
    await supabase.storage.from(MEDIA_BUCKET).remove([logoPath]);
    await saveLogoPath(null);
    setBusy(false);
  }

  const logoUrl = publicMediaUrl(logoPath);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Site-wide branding. The logo appears in the header next to the site
          name (updates go live within about an hour due to page caching).
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {saved && !error ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved.
        </p>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-medium">Logo</h2>
        <p className="mt-1 text-sm text-zinc-500">
          PNG, JPEG, WEBP or GIF. A wide logo about 32–72 px tall works best.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading…</p>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex h-20 min-w-40 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Site logo" className="max-h-14 w-auto" />
              ) : (
                <span className="text-sm text-zinc-400">No logo uploaded</span>
              )}
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
                {busy ? "Working…" : logoUrl ? "Replace logo" : "Upload logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={onUpload}
                  disabled={busy}
                />
              </label>
              {logoUrl ? (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={busy}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
