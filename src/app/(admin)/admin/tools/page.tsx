"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  Json,
  ToolRow,
  ToolStatus,
  ToolTranslationRow,
} from "@/lib/supabase/types";
import { toolCategories } from "@/lib/tools/categories";

type ToolListItem = ToolRow & {
  tool_translations: ToolTranslationRow[] | null;
};

export default function AdminToolsPage() {
  const [tools, setTools] = useState<ToolListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ToolStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  const loadTools = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("tools")
      .select("*, tool_translations(*)")
      .order("sort_order", { ascending: true });

    setLoading(false);

    if (queryError) {
      setError(queryError.message);
      return;
    }

    setTools((data as ToolListItem[]) ?? []);
  }, []);

  useEffect(() => {
    void loadTools();
  }, [loadTools]);

  async function updateStatuses(ids: string[], status: ToolStatus) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || ids.length === 0) return;
    setUpdating(true);
    setError(null);

    for (const id of ids) {
      const tool = tools.find((item) => item.id === id);
      if (!tool) continue;
      const { error: updateError } = await supabase.rpc("admin_upsert_tool", {
        payload: {
          id: tool.id,
          slug: tool.slug,
          category: tool.category,
          status,
          cover_path: tool.cover_path,
          sort_order: tool.sort_order,
          translations: tool.tool_translations ?? [],
        } satisfies Json,
      });
      if (updateError) {
        setError(updateError.message);
        setUpdating(false);
        return;
      }
    }

    setSelected([]);
    await loadTools();
    setUpdating(false);
  }

  const normalizedSearch = search.trim().toLocaleLowerCase("tr");
  const filtered = tools.filter((tool) => {
    const matchesSearch =
      !normalizedSearch ||
      tool.slug.toLocaleLowerCase("tr").includes(normalizedSearch) ||
      (tool.tool_translations ?? []).some((translation) =>
        translation.title.toLocaleLowerCase("tr").includes(normalizedSearch),
      );
    return (
      matchesSearch &&
      (statusFilter === "all" || tool.status === statusFilter) &&
      (categoryFilter === "all" || tool.category === categoryFilter)
    );
  });
  const allVisibleSelected =
    filtered.length > 0 && filtered.every((tool) => selected.includes(tool.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Araçlar</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Araçları, çevirileri ve yayın durumlarını yönetin.
          </p>
        </div>
        <Link
          href="/admin/tools/new"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Yeni araç
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Slug veya başlık ara"
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "all" | ToolStatus)
          }
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="all">Tüm durumlar</option>
          <option value="published">Yayında</option>
          <option value="draft">Taslak</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="all">Tüm kategoriler</option>
          {toolCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <span>{selected.length} araç seçildi</span>
          <button
            type="button"
            disabled={updating}
            onClick={() => updateStatuses(selected, "published")}
            className="font-medium text-blue-700 hover:underline disabled:opacity-50"
          >
            Yayınla
          </button>
          <button
            type="button"
            disabled={updating}
            onClick={() => updateStatuses(selected, "draft")}
            className="font-medium text-blue-700 hover:underline disabled:opacity-50"
          >
            Yayından kaldır
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Yükleniyor…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">Eşleşen araç yok.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              <tr>
                <th className="px-4 py-3 font-medium">
                  <input
                    type="checkbox"
                    aria-label="Görünen tüm araçları seç"
                    checked={allVisibleSelected}
                    onChange={() =>
                      setSelected((current) =>
                        allVisibleSelected
                          ? current.filter(
                              (id) => !filtered.some((tool) => tool.id === id),
                            )
                          : Array.from(
                              new Set([...current, ...filtered.map((tool) => tool.id)]),
                            ),
                      )
                    }
                  />
                </th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Başlık</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Çeviri</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tool) => {
                const title =
                  tool.tool_translations?.find((t) => t.locale === "en")
                    ?.title ??
                  tool.tool_translations?.[0]?.title ??
                  "—";
                return (
                  <tr
                    key={tool.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`${tool.slug} seç`}
                        checked={selected.includes(tool.id)}
                        onChange={() =>
                          setSelected((current) =>
                            current.includes(tool.id)
                              ? current.filter((id) => id !== tool.id)
                              : [...current, tool.id],
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{tool.slug}</td>
                    <td className="px-4 py-3">{title}</td>
                    <td className="px-4 py-3">{tool.category ?? "—"}</td>
                    <td className="px-4 py-3">
                      {
                        new Set(
                          (tool.tool_translations ?? [])
                            .filter((translation) => translation.title.trim())
                            .map((translation) => translation.locale),
                        ).size
                      }
                      /8
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          tool.status === "published"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {tool.status === "published" ? "Yayında" : "Taslak"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/tools/${tool.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Düzenle
                        </Link>
                        <Link
                          href={`/admin/tools/${tool.id}/history`}
                          className="text-blue-600 hover:underline"
                        >
                          Geçmiş
                        </Link>
                        {tool.status === "published" ? (
                          <button
                            type="button"
                            onClick={() => updateStatuses([tool.id], "draft")}
                            className="text-zinc-500 hover:underline"
                          >
                            Yayından kaldır
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateStatuses([tool.id], "published")}
                            className="text-blue-600 hover:underline"
                          >
                            Yayınla
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
