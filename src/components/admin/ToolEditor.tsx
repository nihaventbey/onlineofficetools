"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ToolRow,
  ToolStatus,
  ToolTranslationRow,
} from "@/lib/supabase/types";
import { locales, type Locale } from "@/lib/i18n";

type ToolWithTranslations = ToolRow & {
  tool_translations: ToolTranslationRow[] | null;
};

type TranslationForm = {
  title: string;
  short_description: string;
  seo_title: string;
  seo_description: string;
  content: string;
};

type ToolEditorProps = {
  toolId?: string;
};

const emptyTranslation = (): TranslationForm => ({
  title: "",
  short_description: "",
  seo_title: "",
  seo_description: "",
  content: "",
});

export default function ToolEditor({ toolId }: ToolEditorProps) {
  const router = useRouter();
  const isNew = !toolId;
  const [activeLocale, setActiveLocale] = useState<Locale>("en");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("text");
  const [status, setStatus] = useState<ToolStatus>("draft");
  const [coverPath, setCoverPath] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [translations, setTranslations] = useState<
    Record<Locale, TranslationForm>
  >({
    en: emptyTranslation(),
    tr: emptyTranslation(),
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!toolId) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    void (async () => {
      const { data, error: queryError } = await supabase
        .from("tools")
        .select("*, tool_translations(*)")
        .eq("id", toolId)
        .single();

      setLoading(false);

      if (queryError || !data) {
        setError(queryError?.message ?? "Tool not found");
        return;
      }

      const tool = data as unknown as ToolWithTranslations;

      setSlug(tool.slug);
      setCategory(tool.category ?? "text");
      setStatus(tool.status);
      setCoverPath(tool.cover_path ?? "");
      setSortOrder(tool.sort_order);

      const next = {
        en: emptyTranslation(),
        tr: emptyTranslation(),
      };

      for (const row of tool.tool_translations ?? []) {
        if (row.locale === "en" || row.locale === "tr") {
          next[row.locale as Locale] = {
            title: row.title,
            short_description: row.short_description,
            seo_title: row.seo_title ?? "",
            seo_description: row.seo_description ?? "",
            content: row.content ?? "",
          };
        }
      }

      setTranslations(next);
    })();
  }, [toolId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    if (!slug.trim() || !translations.en.title.trim()) {
      setError("Slug and English title are required.");
      return;
    }

    setSaving(true);

    const payload = {
      slug: slug.trim(),
      category: category.trim() || null,
      status,
      cover_path: coverPath.trim() || null,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    };

    let id = toolId;

    if (isNew) {
      const { data, error: insertError } = await supabase
        .from("tools")
        .insert(payload)
        .select("id")
        .single();

      if (insertError || !data) {
        setSaving(false);
        setError(insertError?.message ?? "Could not create tool");
        return;
      }
      id = data.id;
    } else {
      const { error: updateError } = await supabase
        .from("tools")
        .update(payload)
        .eq("id", toolId);

      if (updateError) {
        setSaving(false);
        setError(updateError.message);
        return;
      }
    }

    for (const locale of locales) {
      const tr = translations[locale];
      if (!tr.title.trim()) continue;

      const { error: upsertError } = await supabase
        .from("tool_translations")
        .upsert(
          {
            tool_id: id!,
            locale,
            title: tr.title.trim(),
            short_description: tr.short_description.trim(),
            seo_title: tr.seo_title.trim() || null,
            seo_description: tr.seo_description.trim() || null,
            content: tr.content.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tool_id,locale" },
        );

      if (upsertError) {
        setSaving(false);
        setError(upsertError.message);
        return;
      }
    }

    setSaving(false);
    router.replace("/admin/tools");
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  const current = translations[activeLocale];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          {isNew ? "New tool" : "Edit tool"}
        </h1>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="word-counter"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Category</span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ToolStatus)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Cover path</span>
          <input
            value={coverPath}
            onChange={(e) => setCoverPath(e.target.value)}
            placeholder="covers/word-counter.png"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Sort order</span>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex gap-2">
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setActiveLocale(locale)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                activeLocale === locale
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Title</span>
            <input
              value={current.title}
              onChange={(e) =>
                setTranslations((prev) => ({
                  ...prev,
                  [activeLocale]: { ...prev[activeLocale], title: e.target.value },
                }))
              }
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              required={activeLocale === "en"}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Short description</span>
            <textarea
              value={current.short_description}
              onChange={(e) =>
                setTranslations((prev) => ({
                  ...prev,
                  [activeLocale]: {
                    ...prev[activeLocale],
                    short_description: e.target.value,
                  },
                }))
              }
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">SEO title</span>
            <input
              value={current.seo_title}
              onChange={(e) =>
                setTranslations((prev) => ({
                  ...prev,
                  [activeLocale]: {
                    ...prev[activeLocale],
                    seo_title: e.target.value,
                  },
                }))
              }
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">SEO description</span>
            <textarea
              value={current.seo_description}
              onChange={(e) =>
                setTranslations((prev) => ({
                  ...prev,
                  [activeLocale]: {
                    ...prev[activeLocale],
                    seo_description: e.target.value,
                  },
                }))
              }
              rows={2}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Editorial content</span>
            <textarea
              value={current.content}
              onChange={(e) =>
                setTranslations((prev) => ({
                  ...prev,
                  [activeLocale]: {
                    ...prev[activeLocale],
                    content: e.target.value,
                  },
                }))
              }
              rows={8}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
        </div>
      </section>
    </form>
  );
}
