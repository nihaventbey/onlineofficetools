"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import type { Dictionary, Locale } from "@/lib/i18n";
import { useRecentTools } from "@/lib/state/useRecentTools";
import { getToolBySlug, toolRegistry } from "@/lib/tools/registry";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

export default function CommandPalette({ locale, dict }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);
  const { recent, favorites } = useRecentTools();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQ("");
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      triggerRef.current?.focus();
    };
  }, [open]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query) {
      return toolRegistry
        .filter((t) => {
          const labels = dict.tools[t.dictKey];
          return (
            t.slug.includes(query) ||
            labels.title.toLowerCase().includes(query) ||
            t.keywords.some((k) => k.includes(query))
          );
        })
        .slice(0, 12);
    }

    const seen = new Set<string>();
    const prioritized = [];
    for (const slug of [...favorites, ...recent]) {
      const tool = getToolBySlug(slug);
      if (!tool || seen.has(tool.slug)) continue;
      seen.add(tool.slug);
      prioritized.push(tool);
    }
    for (const tool of toolRegistry) {
      if (seen.has(tool.slug)) continue;
      seen.add(tool.slug);
      prioritized.push(tool);
      if (prioritized.length >= 12) break;
    }
    return prioritized.slice(0, 12);
  }, [q, dict, favorites, recent]);

  function close() {
    setOpen(false);
    setQ("");
  }

  function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'input, a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="hidden min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 hover:border-blue-300 lg:inline-flex"
        aria-label={dict.common.commandPalette}
      >
        <span>⌘K</span>
        <span className="hidden xl:inline">{dict.common.search}</span>
      </button>
      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
              onClick={close}
            >
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={dict.common.commandPalette}
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={trapFocus}
              >
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={dict.common.commandPalette}
                  className="w-full border-b border-slate-100 px-4 py-3 text-sm outline-none"
                />
                <ul className="max-h-80 overflow-y-auto p-2">
                  {results.map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        href={`/${locale}/tools/${tool.slug}`}
                        onClick={close}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50"
                      >
                        <span className="text-lg" aria-hidden>
                          {tool.emoji ?? "🛠️"}
                        </span>
                        <span className="font-medium text-slate-900">
                          {dict.tools[tool.dictKey].title}
                        </span>
                        <span className="text-xs text-slate-400">
                          {dict.categories[tool.category]}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {!results.length ? (
                    <li className="px-3 py-6 text-center text-sm text-slate-500">
                      {dict.common.noResults}
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
