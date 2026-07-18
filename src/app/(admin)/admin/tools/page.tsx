"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ToolRow, ToolStatus } from "@/lib/supabase/types";

type ToolListItem = ToolRow & {
  tool_translations: { locale: string; title: string }[] | null;
};

export default function AdminToolsPage() {
  const [tools, setTools] = useState<ToolListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTools = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("tools")
      .select("*, tool_translations(locale, title)")
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

  async function updateStatus(id: string, status: ToolStatus) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { error: updateError } = await supabase
      .from("tools")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadTools();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tools</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Draft changes stay private. Publishing updates status for the next
            Vercel build.
          </p>
        </div>
        <Link
          href="/admin/tools/new"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          New tool
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : tools.length === 0 ? (
        <p className="text-sm text-zinc-500">No tools yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              <tr>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => {
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
                    <td className="px-4 py-3 font-mono text-xs">{tool.slug}</td>
                    <td className="px-4 py-3">{title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          tool.status === "published"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {tool.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/tools/${tool.id}`}
                          className="text-violet-600 hover:underline"
                        >
                          Edit
                        </Link>
                        {tool.status === "published" ? (
                          <button
                            type="button"
                            onClick={() => updateStatus(tool.id, "draft")}
                            className="text-zinc-500 hover:underline"
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateStatus(tool.id, "published")}
                            className="text-emerald-600 hover:underline"
                          >
                            Publish
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
