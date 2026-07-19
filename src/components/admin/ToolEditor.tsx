"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  Json,
  ToolFaq,
  ToolRow,
  ToolStatus,
  ToolTranslationRow,
} from "@/lib/supabase/types";
import { locales, type Locale } from "@/lib/i18n";
import { toolCategories } from "@/lib/tools/categories";
import { isRegisteredSlug } from "@/lib/tools/registry";

type ToolWithTranslations = ToolRow & {
  tool_translations: ToolTranslationRow[] | null;
};

type ContentBlock = { type: string; text: string };

type TranslationForm = {
  title: string;
  short_description: string;
  seo_title: string;
  seo_description: string;
  content: string;
  faqs: ToolFaq[];
  howto_steps: string[];
  content_blocks: ContentBlock[];
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
  faqs: [],
  howto_steps: [],
  content_blocks: [],
});

function isPlainObject(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseFaqs(value: Json): ToolFaq[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ToolFaq => {
    if (!isPlainObject(item)) return false;
    return typeof item.q === "string" && typeof item.a === "string";
  });
}

function parseSteps(value: Json): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseContentBlocks(value: Json): ContentBlock[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (!isPlainObject(item)) return { type: "paragraph", text: "" };
    return {
      type: typeof item.type === "string" ? item.type : "paragraph",
      text: typeof item.text === "string" ? item.text : "",
    };
  });
}

const emptyTranslations = (): Record<Locale, TranslationForm> =>
  Object.fromEntries(
    locales.map((locale) => [locale, emptyTranslation()]),
  ) as Record<Locale, TranslationForm>;

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
  >(emptyTranslations);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);

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
      setExpectedUpdatedAt(tool.updated_at);

      const next = emptyTranslations();

      for (const row of tool.tool_translations ?? []) {
        if ((locales as readonly string[]).includes(row.locale)) {
          next[row.locale as Locale] = {
            title: row.title,
            short_description: row.short_description,
            seo_title: row.seo_title ?? "",
            seo_description: row.seo_description ?? "",
            content: row.content ?? "",
            faqs: parseFaqs(row.faqs),
            howto_steps: parseSteps(row.howto_steps),
            content_blocks: parseContentBlocks(row.content_blocks),
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
      setError("Supabase yapılandırılmamış.");
      return;
    }

    if (!slug.trim() || !translations.en.title.trim()) {
      setError("Slug ve İngilizce başlık zorunludur.");
      return;
    }

    if (!isRegisteredSlug(slug.trim())) {
      setError(
        "Slug araç kayıtlarında yok. Yayınlamadan önce bileşen/yükleyici ekleyin.",
      );
      return;
    }

    setSaving(true);

    const payload = {
      id: toolId ?? null,
      slug: slug.trim(),
      category: category.trim() || null,
      status,
      cover_path: coverPath.trim() || null,
      sort_order: sortOrder,
      expected_updated_at: expectedUpdatedAt,
      translations: locales
        .filter((locale) => translations[locale].title.trim())
        .map((locale) => {
          const tr = translations[locale];
          return {
            locale,
            title: tr.title.trim(),
            short_description: tr.short_description.trim(),
            seo_title: tr.seo_title.trim() || null,
            seo_description: tr.seo_description.trim() || null,
            content: tr.content.trim() || null,
            faqs: tr.faqs
              .map(({ q, a }) => ({ q: q.trim(), a: a.trim() }))
              .filter(({ q, a }) => q && a),
            howto_steps: tr.howto_steps.map((step) => step.trim()).filter(Boolean),
            content_blocks: tr.content_blocks as Json,
          };
        }),
    } satisfies Json;

    const { error: saveError } = await supabase.rpc("admin_upsert_tool", {
      payload,
    });
    if (saveError) {
      setSaving(false);
      setError(saveError.message);
      return;
    }

    setSaving(false);
    router.replace("/admin/tools");
    router.refresh();
  }

  async function openPreview() {
    if (!toolId || !slug.trim()) return;
    setPreviewBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/preview-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, slug: slug.trim() }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Önizleme bağlantısı oluşturulamadı.");
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Önizleme bağlantısı oluşturulamadı.");
    } finally {
      setPreviewBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Yükleniyor…</p>;
  }

  const current = translations[activeLocale];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          {isNew ? "Yeni araç" : "Aracı düzenle"}
        </h1>
        <div className="flex gap-2">
          {toolId ? (
            <>
              <button
                type="button"
                disabled={previewBusy}
                onClick={() => void openPreview()}
                className="rounded-xl border border-amber-200 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-60"
              >
                {previewBusy ? "Açılıyor…" : "Taslak önizle"}
              </button>
              <Link
                href={`/admin/tools/${toolId}/history`}
                className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
              >
                Geçmiş
              </Link>
            </>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
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
            placeholder="word-counter (must match registry)"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Kategori</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          >
            {toolCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Durum</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ToolStatus)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="draft">Taslak</option>
            <option value="published">Yayında</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Kapak yolu</span>
          <input
            value={coverPath}
            onChange={(e) => setCoverPath(e.target.value)}
            placeholder="covers/word-counter.png"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Sıralama</span>
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
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Başlık</span>
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
            <span className="mb-1 block font-medium">Kısa açıklama</span>
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
            <span className="mb-1 block font-medium">SEO başlığı</span>
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
            <span className="mb-1 block font-medium">SEO açıklaması</span>
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
            <span className="mb-1 block font-medium">Editoryal içerik</span>
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
          <fieldset className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <legend className="font-medium">SSS</legend>
              <button
                type="button"
                onClick={() =>
                  setTranslations((prev) => ({
                    ...prev,
                    [activeLocale]: {
                      ...prev[activeLocale],
                      faqs: [...prev[activeLocale].faqs, { q: "", a: "" }],
                    },
                  }))
                }
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Soru ekle
              </button>
            </div>
            {current.faqs.map((faq, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={faq.q}
                  aria-label={`Soru ${index + 1}`}
                  placeholder="Soru"
                  onChange={(event) =>
                    setTranslations((prev) => {
                      const faqs = [...prev[activeLocale].faqs];
                      faqs[index] = { ...faqs[index], q: event.target.value };
                      return {
                        ...prev,
                        [activeLocale]: { ...prev[activeLocale], faqs },
                      };
                    })
                  }
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
                <input
                  value={faq.a}
                  aria-label={`Yanıt ${index + 1}`}
                  placeholder="Yanıt"
                  onChange={(event) =>
                    setTranslations((prev) => {
                      const faqs = [...prev[activeLocale].faqs];
                      faqs[index] = { ...faqs[index], a: event.target.value };
                      return {
                        ...prev,
                        [activeLocale]: { ...prev[activeLocale], faqs },
                      };
                    })
                  }
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
                <button
                  type="button"
                  onClick={() =>
                    setTranslations((prev) => ({
                      ...prev,
                      [activeLocale]: {
                        ...prev[activeLocale],
                        faqs: prev[activeLocale].faqs.filter((_, i) => i !== index),
                      },
                    }))
                  }
                  className="text-sm text-red-600"
                >
                  Sil
                </button>
              </div>
            ))}
          </fieldset>
          <fieldset className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <legend className="font-medium">Nasıl yapılır adımları</legend>
              <button
                type="button"
                onClick={() =>
                  setTranslations((prev) => ({
                    ...prev,
                    [activeLocale]: {
                      ...prev[activeLocale],
                      howto_steps: [...prev[activeLocale].howto_steps, ""],
                    },
                  }))
                }
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Adım ekle
              </button>
            </div>
            {current.howto_steps.map((step, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={step}
                  aria-label={`Adım ${index + 1}`}
                  placeholder={`${index + 1}. adım`}
                  onChange={(event) =>
                    setTranslations((prev) => {
                      const howto_steps = [...prev[activeLocale].howto_steps];
                      howto_steps[index] = event.target.value;
                      return {
                        ...prev,
                        [activeLocale]: { ...prev[activeLocale], howto_steps },
                      };
                    })
                  }
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
                <button
                  type="button"
                  onClick={() =>
                    setTranslations((prev) => ({
                      ...prev,
                      [activeLocale]: {
                        ...prev[activeLocale],
                        howto_steps: prev[activeLocale].howto_steps.filter(
                          (_, i) => i !== index,
                        ),
                      },
                    }))
                  }
                  className="text-sm text-red-600"
                >
                  Sil
                </button>
              </div>
            ))}
          </fieldset>

          <fieldset className="space-y-3">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-medium">İçerik blokları</legend>
              <button
                type="button"
                onClick={() =>
                  setTranslations((prev) => {
                    const blocks = [...prev[activeLocale].content_blocks];
                    blocks.push({ type: "paragraph", text: "" });
                    return {
                      ...prev,
                      [activeLocale]: {
                        ...prev[activeLocale],
                        content_blocks: blocks,
                      },
                    };
                  })
                }
                className="text-sm font-medium text-blue-600"
              >
                + Paragraf ekle
              </button>
            </div>
            {current.content_blocks.map((block, index) => (
              <div key={index} className="space-y-2 rounded-xl border border-zinc-100 p-3">
                <textarea
                  value={block.text}
                  onChange={(event) =>
                    setTranslations((prev) => {
                      const blocks = [...prev[activeLocale].content_blocks];
                      blocks[index] = {
                        type: "paragraph",
                        text: event.target.value,
                      };
                      return {
                        ...prev,
                        [activeLocale]: {
                          ...prev[activeLocale],
                          content_blocks: blocks,
                        },
                      };
                    })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="Paragraf metni"
                />
                <button
                  type="button"
                  onClick={() =>
                    setTranslations((prev) => {
                      return {
                        ...prev,
                        [activeLocale]: {
                          ...prev[activeLocale],
                          content_blocks: prev[activeLocale].content_blocks.filter(
                            (_, i) => i !== index,
                          ),
                        },
                      };
                    })
                  }
                  className="text-sm text-red-600"
                >
                  Sil
                </button>
              </div>
            ))}
          </fieldset>
        </div>
      </section>
    </form>
  );
}
