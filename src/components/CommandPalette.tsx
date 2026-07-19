"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import type { Dictionary, Locale } from "@/lib/i18n";
import { useRecentTools } from "@/lib/state/useRecentTools";
import { getToolBySlug, isToolAvailableInLocale, toolRegistry } from "@/lib/tools/registry";

type Props = {
  locale: Locale;
  dict: Dictionary;
  /**
   * `responsive` — compact icon below xl, ⌘K chip at xl+ (header).
   * `compact` — icon-only (or full-width search row when `fullWidth`).
   * `desktop` — ⌘K chip only.
   */
  variant?: "responsive" | "compact" | "desktop";
  fullWidth?: boolean;
  /** When false, Cmd/Ctrl+K is ignored (use for secondary instances). */
  enableHotkey?: boolean;
  className?: string;
};

export default function CommandPalette({
  locale,
  dict,
  variant = "desktop",
  fullWidth = false,
  enableHotkey = true,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);
  const { recent, favorites } = useRecentTools();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!enableHotkey) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enableHotkey]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        setQ("");
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      (lastTriggerRef.current ?? triggerRef.current)?.focus();
    };
  }, [open]);

  function openPalette(event: ReactMouseEvent<HTMLButtonElement>) {
    lastTriggerRef.current = event.currentTarget;
    setOpen(true);
  }

  const results = useMemo(() => {
    const available = toolRegistry.filter((t) =>
      isToolAvailableInLocale(t.slug, locale),
    );
    const query = q.trim().toLowerCase();
    if (query) {
      return available
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
      if (!isToolAvailableInLocale(tool.slug, locale)) continue;
      seen.add(tool.slug);
      prioritized.push(tool);
    }
    for (const tool of available) {
      if (seen.has(tool.slug)) continue;
      seen.add(tool.slug);
      prioritized.push(tool);
      if (prioritized.length >= 12) break;
    }
    return prioritized.slice(0, 12);
  }, [q, dict, favorites, recent, locale]);

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

  const showCompact = variant === "compact" || variant === "responsive";
  const showDesktop = variant === "desktop" || variant === "responsive";

  return (
    <>
      {showCompact ? (
        <button
          ref={variant === "compact" ? triggerRef : undefined}
          type="button"
          onClick={openPalette}
          className={`inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
            fullWidth
              ? "w-full justify-start gap-2 px-3 text-sm font-medium"
              : "w-11"
          } ${variant === "responsive" ? "xl:hidden" : ""} ${className}`}
          aria-label={dict.common.commandPalette}
          title={dict.common.search}
        >
          <span aria-hidden className="text-base font-semibold">
            ⌕
          </span>
          {fullWidth ? (
            <span className="truncate text-slate-500">
              {dict.common.commandPalette}
            </span>
          ) : null}
        </button>
      ) : null}

      {showDesktop ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={openPalette}
          className={`h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 transition hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
            variant === "responsive" ? "hidden xl:inline-flex" : "inline-flex"
          } ${className}`}
          aria-label={dict.common.commandPalette}
          title={dict.common.search}
        >
          <span aria-hidden>⌘K</span>
          <span className="hidden 2xl:inline">{dict.common.search}</span>
        </button>
      ) : null}

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
                  className="w-full border-b border-slate-100 px-4 py-3.5 text-sm outline-none focus:bg-slate-50/60"
                />
                <ul className="max-h-80 overflow-y-auto p-2">
                  {results.map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        href={`/${locale}/tools/${tool.slug}`}
                        onClick={close}
                        className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50"
                      >
                        <span className="text-lg" aria-hidden>
                          {tool.emoji ?? "🛠️"}
                        </span>
                        <span className="font-medium text-slate-900">
                          {dict.tools[tool.dictKey].title}
                        </span>
                        <span className="ms-auto text-xs text-slate-400">
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
