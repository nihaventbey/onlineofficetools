"use client";

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";
import { MEDIA_BUCKET, publicMediaUrl } from "@/lib/cms";
import type { MediaRow } from "@/lib/supabase/types";

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (queryError) {
      setError(queryError.message);
      return;
    }

    setItems(data ?? []);
  }, []);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setUploading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const ext = file.name.split(".").pop() ?? "bin";
    const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase.from("media").insert({
      path,
      alt_text: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: user?.id ?? null,
    });

    setUploading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    event.target.value = "";
    await loadMedia();
  }

  async function onDelete(item: MediaRow) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { count, error: usageError } = await supabase
      .from("tools")
      .select("id", { count: "exact", head: true })
      .eq("cover_path", item.path);
    if (usageError) {
      setError(usageError.message);
      return;
    }
    const warning = count
      ? `Bu medya ${count} aracın kapağı olarak kullanılıyor. Silmek bu kapakları bozabilir.\n\n`
      : "";
    if (!window.confirm(`${warning}"${item.path}" silinsin mi?`)) return;

    const { error: storageError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .remove([item.path]);

    if (storageError) {
      setError(storageError.message);
      return;
    }

    const { error: deleteError } = await supabase
      .from("media")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadMedia();
  }

  async function saveAltText(item: MediaRow, altText: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSavingId(item.id);
    setError(null);
    const { error: updateError } = await supabase
      .from("media")
      .update({ alt_text: altText.trim() || null })
      .eq("id", item.id);
    setSavingId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setItems((current) =>
      current.map((row) =>
        row.id === item.id ? { ...row, alt_text: altText.trim() || null } : row,
      ),
    );
  }

  const query = search.trim().toLocaleLowerCase("tr");
  const filteredItems = items.filter(
    (item) =>
      !query ||
      item.path.toLocaleLowerCase("tr").includes(query) ||
      item.alt_text?.toLocaleLowerCase("tr").includes(query),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Medya</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Görseller herkese açık <code>{MEDIA_BUCKET}</code> kovasında saklanır.
          </p>
        </div>
        <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
          {uploading ? "Yükleniyor…" : "Görsel yükle"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={onUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Dosya yolu veya alt metin ara"
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />

      {loading ? (
        <p className="text-sm text-zinc-500">Yükleniyor…</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-zinc-500">Eşleşen medya yok.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const url = publicMediaUrl(item.path);
            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={item.alt_text ?? item.path}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-zinc-100 text-sm text-zinc-400">
                    Önizleme yok
                  </div>
                )}
                <div className="space-y-2 p-3">
                  <p className="truncate font-mono text-xs text-zinc-500">
                    {item.path}
                  </p>
                  <label className="block text-xs font-medium text-zinc-600">
                    Alt metin
                    <input
                      key={`${item.id}-${item.alt_text ?? ""}`}
                      defaultValue={item.alt_text ?? ""}
                      onBlur={(event) => {
                        if (event.target.value !== (item.alt_text ?? "")) {
                          void saveAltText(item, event.target.value);
                        }
                      }}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm font-normal dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  </label>
                  {savingId === item.id ? (
                    <p className="text-xs text-blue-600">Kaydediliyor…</p>
                  ) : null}
                  <div className="flex gap-2">
                    {url ? (
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(item.path)}
                        className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700"
                      >
                        Yolu kopyala
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 dark:border-red-900"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
