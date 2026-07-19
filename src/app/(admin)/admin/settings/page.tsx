"use client";

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  LOGO_SETTING_KEY,
  MAINTENANCE_MESSAGE_SETTING_KEY,
  MEDIA_BUCKET,
  publicMediaUrl,
  SITE_NAME_SETTING_KEY,
  SITE_TAGLINE_SETTING_KEY,
} from "@/lib/cms";

type TextSettings = {
  siteName: string;
  siteTagline: string;
  maintenanceMessage: string;
};

async function upsertSettingValue(
  key: string,
  value: string | null,
): Promise<string | null> {
  try {
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      return data.error ?? "Ayar kaydedilemedi.";
    }
    return null;
  } catch {
    return "Ayar kaydedilemedi.";
  }
}

export default function AdminSettingsPage() {
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [textSettings, setTextSettings] = useState<TextSettings>({
    siteName: "",
    siteTagline: "",
    maintenanceMessage: "",
  });
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
      .select("key, translations:site_setting_translations(value, locale)")
      .in("key", [
        LOGO_SETTING_KEY,
        SITE_NAME_SETTING_KEY,
        SITE_TAGLINE_SETTING_KEY,
        MAINTENANCE_MESSAGE_SETTING_KEY,
      ]);
    setLoading(false);

    if (queryError) {
      setError(queryError.message);
      return;
    }

    const rows =
      (data as unknown as {
        key: string;
        translations?: { value: string; locale: string }[];
      }[]) ?? [];

    function valueOf(key: string) {
      const row = rows.find((item) => item.key === key);
      const translations = row?.translations ?? [];
      return (
        translations.find((t) => t.locale === "en")?.value ??
        translations[0]?.value ??
        ""
      );
    }

    setLogoPath(valueOf(LOGO_SETTING_KEY) || null);
    setTextSettings({
      siteName: valueOf(SITE_NAME_SETTING_KEY),
      siteTagline: valueOf(SITE_TAGLINE_SETTING_KEY),
      maintenanceMessage: valueOf(MAINTENANCE_MESSAGE_SETTING_KEY),
    });
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function saveLogoPath(path: string | null): Promise<boolean> {
    setError(null);
    setSaved(false);
    const err = await upsertSettingValue(LOGO_SETTING_KEY, path);
    if (err) {
      setError(err);
      return false;
    }
    setLogoPath(path);
    setSaved(true);
    return true;
  }

  async function saveTextSettings() {
    setBusy(true);
    setError(null);
    setSaved(false);
    for (const [key, value] of [
      [SITE_NAME_SETTING_KEY, textSettings.siteName],
      [SITE_TAGLINE_SETTING_KEY, textSettings.siteTagline],
      [MAINTENANCE_MESSAGE_SETTING_KEY, textSettings.maintenanceMessage],
    ] as const) {
      const err = await upsertSettingValue(key, value.trim() || null);
      if (err) {
        setBusy(false);
        setError(err);
        return;
      }
    }
    setBusy(false);
    setSaved(true);
  }

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase yapılandırılmamış.");
      return;
    }

    setBusy(true);
    setError(null);

    const previousPath = logoPath;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `branding/logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      setBusy(false);
      setError(uploadError.message);
      return;
    }

    // Persist path + revalidate layouts before deleting the previous object
    // so cached HTML never points at a removed file.
    const ok = await saveLogoPath(path);
    if (!ok) {
      await supabase.storage.from(MEDIA_BUCKET).remove([path]);
      setBusy(false);
      event.target.value = "";
      return;
    }

    if (previousPath && previousPath !== path) {
      await supabase.storage.from(MEDIA_BUCKET).remove([previousPath]);
    }

    setBusy(false);
    event.target.value = "";
  }

  async function onRemove() {
    if (!logoPath) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setError(null);
    const pathToRemove = logoPath;
    const ok = await saveLogoPath(null);
    if (ok) {
      await supabase.storage.from(MEDIA_BUCKET).remove([pathToRemove]);
    }
    setBusy(false);
  }

  const logoUrl = publicMediaUrl(logoPath);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ayarlar</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Site adı, marka ve bakım duyurusu. Hassas anahtarlar buraya yazılmaz.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {saved && !error ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Kaydedildi.
        </p>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium">Site bilgileri</h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Yükleniyor…</p>
        ) : (
          <>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Site adı</span>
              <input
                value={textSettings.siteName}
                onChange={(event) =>
                  setTextSettings((prev) => ({
                    ...prev,
                    siteName: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Slogan / tagline</span>
              <input
                value={textSettings.siteTagline}
                onChange={(event) =>
                  setTextSettings((prev) => ({
                    ...prev,
                    siteTagline: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Bakım duyurusu</span>
              <textarea
                value={textSettings.maintenanceMessage}
                onChange={(event) =>
                  setTextSettings((prev) => ({
                    ...prev,
                    maintenanceMessage: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Boş bırakılırsa duyuru gösterilmez"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveTextSettings()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {busy ? "Kaydediliyor…" : "Site bilgilerini kaydet"}
            </button>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium">Logo</h2>
        <p className="mt-1 text-sm text-zinc-500">
          PNG, JPEG, WEBP, GIF veya SVG. Yaklaşık 32–72 px yükseklik önerilir.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Yükleniyor…</p>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex h-20 min-w-40 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Site logosu"
                  className="h-9 max-w-40 object-contain"
                />
              ) : (
                <span className="text-sm text-zinc-400">Logo yok</span>
              )}
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
                {busy ? "İşleniyor…" : logoUrl ? "Logoyu değiştir" : "Logo yükle"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  className="hidden"
                  onChange={onUpload}
                  disabled={busy}
                />
              </label>
              {logoUrl ? (
                <button
                  type="button"
                  onClick={() => void onRemove()}
                  disabled={busy}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Kaldır
                </button>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
