"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ToolRevisionRow } from "@/lib/supabase/types";

type Props = { params: Promise<{ id: string }> };

export default function ToolHistoryPage({ params }: Props) {
  const { id } = use(params);
  const [revisions, setRevisions] = useState<ToolRevisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRevisions = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("tool_revisions")
      .select("*")
      .eq("tool_id", id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (queryError) {
      setError(queryError.message);
      return;
    }
    setRevisions(data ?? []);
  }, [id]);

  useEffect(() => {
    void loadRevisions();
  }, [loadRevisions]);

  async function restore(revision: ToolRevisionRow) {
    if (
      !window.confirm(
        "Bu sürüm geri yüklenecek ve mevcut içerik yeni bir revizyon olarak korunacak. Devam edilsin mi?",
      )
    ) {
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setRestoring(revision.id);
    setError(null);
    const { error: restoreError } = await supabase.rpc(
      "admin_restore_tool_revision",
      { revision_id: revision.id },
    );
    setRestoring(null);
    if (restoreError) {
      setError(restoreError.message);
      return;
    }
    await loadRevisions();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Araç geçmişi</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kaydedilen sürümleri görüntüleyin veya geri yükleyin.
          </p>
        </div>
        <Link
          href={`/admin/tools/${id}`}
          className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          Araca dön
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Yükleniyor…</p>
      ) : revisions.length === 0 ? (
        <p className="text-sm text-zinc-500">Henüz kaydedilmiş sürüm yok.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              <tr>
                <th className="px-4 py-3 font-medium">Tarih</th>
                <th className="px-4 py-3 font-medium">İşlemi yapan</th>
                <th className="px-4 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {revisions.map((revision) => (
                <tr
                  key={revision.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                >
                  <td className="px-4 py-3">
                    {new Intl.DateTimeFormat("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(revision.created_at))}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {revision.actor_id ?? "Sistem"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <button
                        type="button"
                        disabled={restoring !== null}
                        onClick={() => restore(revision)}
                        className="font-medium text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {restoring === revision.id
                          ? "Geri yükleniyor…"
                          : "Bu sürümü geri yükle"}
                      </button>
                      <details className="text-xs text-zinc-500">
                        <summary className="cursor-pointer">Anlık görüntü</summary>
                        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-zinc-50 p-2 dark:bg-zinc-950">
                          {JSON.stringify(revision.snapshot, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
