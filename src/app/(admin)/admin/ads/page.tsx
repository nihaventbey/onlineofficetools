"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ADSENSE_SETTING_KEYS,
  PLACEMENT_SETTING_KEY_BY_PLACEMENT,
  SLOT_SETTING_KEY_BY_PLACEMENT,
  adPlacementKeys,
  isValidClient,
  isValidSlot,
  type AdPlacementKey,
} from "@/lib/adsense";

type SlotState = Record<AdPlacementKey, string>;
type PlacementState = Record<AdPlacementKey, boolean>;

const PLACEMENT_LABELS: Record<AdPlacementKey, string> = {
  top: "Üst banner",
  sidebar: "Kenar çubuğu",
  bottom: "Alt banner",
  toolInline: "Araç içi reklam",
};

const SLOT_LABELS: Record<AdPlacementKey, string> = {
  top: "Üst banner slot ID",
  sidebar: "Kenar çubuğu slot ID",
  bottom: "Alt banner slot ID",
  toolInline: "Araç içi slot ID",
};

const emptySlots = (): SlotState => ({
  top: "",
  sidebar: "",
  bottom: "",
  toolInline: "",
});

const defaultPlacements = (): PlacementState => ({
  top: true,
  sidebar: true,
  bottom: true,
  toolInline: true,
});

async function upsertSetting(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  key: string,
  value: string,
) {
  const { data: existing, error: selectError } = await supabase
    .from("site_settings")
    .select("id")
    .eq("key", key)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);

  let settingId = existing?.id ?? null;
  if (!settingId) {
    const { data: inserted, error: insertError } = await supabase
      .from("site_settings")
      .insert({ key })
      .select("id")
      .single();
    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? `"${key}" ayarı oluşturulamadı.`);
    }
    settingId = inserted.id;
  }

  const { data: existingTr } = await supabase
    .from("site_setting_translations")
    .select("id")
    .eq("setting_id", settingId)
    .eq("locale", "en")
    .maybeSingle();

  const write = existingTr
    ? supabase
        .from("site_setting_translations")
        .update({ value })
        .eq("id", existingTr.id)
    : supabase
        .from("site_setting_translations")
        .insert({ setting_id: settingId, locale: "en", value });

  const { error: writeError } = await write;
  if (writeError) throw new Error(writeError.message);
}

export default function AdminAdsPage() {
  const [enabled, setEnabled] = useState(true);
  const [clientId, setClientId] = useState("");
  const [slots, setSlots] = useState<SlotState>(emptySlots);
  const [placements, setPlacements] = useState<PlacementState>(defaultPlacements);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadSettings = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const keys = Object.values(ADSENSE_SETTING_KEYS);
    const { data, error: queryError } = await supabase
      .from("site_settings")
      .select("key, translations:site_setting_translations(value, locale)")
      .in("key", keys);
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

    const valueOf = (key: string): string | null => {
      const translations = rows.find((r) => r.key === key)?.translations ?? [];
      return (
        translations.find((t) => t.locale === "en")?.value ??
        translations[0]?.value ??
        null
      );
    };
    const toBool = (value: string | null, fallback: boolean) =>
      value === null ? fallback : value === "true";

    setEnabled(toBool(valueOf(ADSENSE_SETTING_KEYS.enabled), true));
    setClientId(valueOf(ADSENSE_SETTING_KEYS.clientId) ?? "");

    const nextSlots = emptySlots();
    const nextPlacements = defaultPlacements();
    for (const placement of adPlacementKeys) {
      nextSlots[placement] =
        valueOf(SLOT_SETTING_KEY_BY_PLACEMENT[placement]) ?? "";
      nextPlacements[placement] = toBool(
        valueOf(PLACEMENT_SETTING_KEY_BY_PLACEMENT[placement]),
        true,
      );
    }
    setSlots(nextSlots);
    setPlacements(nextPlacements);
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const clientIdTrimmed = clientId.trim();
  const clientIdError =
    clientIdTrimmed.length > 0 && !isValidClient(clientIdTrimmed)
      ? "Geçersiz format. Örnek: ca-pub-1234567890123456"
      : null;
  const slotErrors: Partial<Record<AdPlacementKey, string>> = {};
  for (const placement of adPlacementKeys) {
    const value = slots[placement].trim();
    if (value.length > 0 && !isValidSlot(value)) {
      slotErrors[placement] = "Sadece rakamlardan oluşmalı.";
    }
  }
  const hasBlockingErrors =
    Boolean(clientIdError) || Object.keys(slotErrors).length > 0;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase yapılandırılmamış.");
      return;
    }

    if (clientIdTrimmed && !isValidClient(clientIdTrimmed)) {
      setError("Yayıncı kimliği (client ID) geçersiz.");
      return;
    }
    for (const placement of adPlacementKeys) {
      const value = slots[placement].trim();
      if (value && !isValidSlot(value)) {
        setError(`${SLOT_LABELS[placement]} geçersiz — sadece rakam girin.`);
        return;
      }
    }

    setSaving(true);
    try {
      await upsertSetting(
        supabase,
        ADSENSE_SETTING_KEYS.enabled,
        enabled ? "true" : "false",
      );
      await upsertSetting(supabase, ADSENSE_SETTING_KEYS.clientId, clientIdTrimmed);
      for (const placement of adPlacementKeys) {
        await upsertSetting(
          supabase,
          SLOT_SETTING_KEY_BY_PLACEMENT[placement],
          slots[placement].trim(),
        );
        await upsertSetting(
          supabase,
          PLACEMENT_SETTING_KEY_BY_PLACEMENT[placement],
          placements[placement] ? "true" : "false",
        );
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Yükleniyor…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Reklamlar</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Google AdSense yapılandırması. Yalnızca yapılandırılmış kimlik ve
            slot bilgileri kaydedilir — ham HTML/script girişi yoktur.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving || hasBlockingErrors}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
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

      <section className="rounded-2xl border border-blue-100 bg-white p-5">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-5 w-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="font-medium text-slate-900">Reklamları etkinleştir</span>
        </label>
        <p className="mt-2 text-sm text-slate-500">
          Kapatıldığında sitede hiçbir reklam alanı görüntülenmez.
        </p>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white p-5">
        <h2 className="text-lg font-medium text-slate-900">Yayıncı kimliği</h2>
        <label className="mt-3 block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            AdSense Client ID
          </span>
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="ca-pub-3156607388655691"
            className={`w-full rounded-xl border px-3 py-2 font-mono text-sm ${
              clientIdError
                ? "border-red-300 bg-red-50"
                : "border-blue-100 bg-blue-50/40"
            }`}
          />
          {clientIdError ? (
            <span className="mt-1 block text-xs text-red-600">{clientIdError}</span>
          ) : (
            <span className="mt-1 block text-xs text-slate-500">
              Boş bırakılırsa ortam değişkeni veya varsayılan kimlik kullanılır.
            </span>
          )}
        </label>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white p-5">
        <h2 className="text-lg font-medium text-slate-900">Reklam alanları</h2>
        <p className="mt-1 text-sm text-slate-500">
          Her alan için AdSense slot ID&apos;sini girin ve gösterilip
          gösterilmeyeceğini seçin.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {adPlacementKeys.map((placement) => (
            <div
              key={placement}
              className="rounded-xl border border-blue-100 bg-blue-50/30 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-900">
                  {PLACEMENT_LABELS[placement]}
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={placements[placement]}
                    onChange={(e) =>
                      setPlacements((prev) => ({
                        ...prev,
                        [placement]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  Göster
                </label>
              </div>
              <label className="mt-2 block text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  {SLOT_LABELS[placement]}
                </span>
                <input
                  value={slots[placement]}
                  onChange={(e) =>
                    setSlots((prev) => ({ ...prev, [placement]: e.target.value }))
                  }
                  placeholder="1234567890"
                  className={`w-full rounded-lg border px-3 py-2 font-mono text-sm ${
                    slotErrors[placement]
                      ? "border-red-300 bg-red-50"
                      : "border-blue-100 bg-white"
                  }`}
                />
                {slotErrors[placement] ? (
                  <span className="mt-1 block text-xs text-red-600">
                    {slotErrors[placement]}
                  </span>
                ) : null}
              </label>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
