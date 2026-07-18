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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Media</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Images are stored in the public <code>{MEDIA_BUCKET}</code> bucket.
          </p>
        </div>
        <label className="cursor-pointer rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
          {uploading ? "Uploading…" : "Upload image"}
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

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-500">No media yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
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
                    No preview
                  </div>
                )}
                <div className="space-y-2 p-3">
                  <p className="truncate font-mono text-xs text-zinc-500">
                    {item.path}
                  </p>
                  <div className="flex gap-2">
                    {url ? (
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(item.path)}
                        className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700"
                      >
                        Copy path
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 dark:border-red-900"
                    >
                      Delete
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
