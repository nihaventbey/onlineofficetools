"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CmsAuditEventRow } from "@/lib/supabase/types";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState({
    published: 0,
    draft: 0,
    incomplete: 0,
    yes: 0,
    no: 0,
  });
  const [events, setEvents] = useState<CmsAuditEventRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void (async () => {
      const [toolsResult, eventsResult, feedbackResult] = await Promise.all([
        supabase
          .from("tools")
          .select("status, tool_translations(locale, title)"),
        supabase
          .from("cms_audit_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("tool_feedback_stats").select("yes_count, no_count"),
      ]);
      const firstError =
        toolsResult.error ?? eventsResult.error ?? feedbackResult.error;
      if (firstError) {
        setError(firstError.message);
        return;
      }
      const tools = (toolsResult.data ?? []) as {
        status: "draft" | "published";
        tool_translations:
          | { locale: string; title: string }[]
          | null;
      }[];
      const feedback = feedbackResult.data ?? [];
      setMetrics({
        published: tools.filter((tool) => tool.status === "published").length,
        draft: tools.filter((tool) => tool.status === "draft").length,
        incomplete: tools.filter(
          (tool) =>
            new Set(
              (tool.tool_translations ?? [])
                .filter((translation) => translation.title.trim())
                .map((translation) => translation.locale),
            ).size < 8,
        ).length,
        yes: feedback.reduce((sum, row) => sum + row.yes_count, 0),
        no: feedback.reduce((sum, row) => sum + row.no_count, 0),
      });
      setEvents(eventsResult.data ?? []);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Yönetim paneli</h1>
        <p className="mt-1 text-sm text-zinc-500">
          İçerik, çeviri ve kullanıcı geri bildirimlerinin özeti.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Yayındaki araç", metrics.published],
          ["Taslak araç", metrics.draft],
          ["Eksik çeviri", metrics.incomplete],
          ["Olumlu oy", metrics.yes],
          ["Olumsuz oy", metrics.no],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-blue-600">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/tools"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="font-semibold">Araçlar</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Araçları oluşturun, çevirin ve yayınlayın.
          </p>
        </Link>
        <Link
          href="/admin/media"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="font-semibold">Medya</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Supabase Storage görsellerini yönetin.
          </p>
        </Link>
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="border-b border-zinc-200 px-4 py-3 font-semibold dark:border-zinc-800">
          Son işlemler
        </h2>
        {events.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Henüz işlem kaydı yok.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span>
                  <strong className="text-blue-700">{event.action}</strong>{" "}
                  {event.entity_type} {event.entity_id ?? ""}
                </span>
                <span className="text-xs text-zinc-500">
                  {new Intl.DateTimeFormat("tr-TR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(event.created_at))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
