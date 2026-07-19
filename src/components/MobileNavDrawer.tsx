"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import CommandPalette from "@/components/CommandPalette";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import QuickAccessMenu from "@/components/tools/QuickAccessMenu";
import type { Dictionary, Locale } from "@/lib/i18n";
import { categoryStyles, toolCategories } from "@/lib/tools/categories";
import { toolRegistry, toolsByCategory } from "@/lib/tools/registry";

type Props = {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  dict: Dictionary;
  siteName: string;
  logoUrl?: string | null;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
};

export default function MobileNavDrawer({
  open,
  onClose,
  locale,
  dict,
  siteName,
  logoUrl,
  menuButtonRef,
}: Props) {
  const pathname = usePathname();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mobileCat, setMobileCat] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    if (open) onClose();
  }, [pathname, open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      menuButtonRef.current?.focus();
    };
  }, [open, menuButtonRef]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), select, input, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
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

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] xl:hidden" role="presentation">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapFocus}
        className="absolute inset-y-0 right-0 flex w-[min(100vw,22rem)] flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-7 max-w-[7.5rem] object-contain object-left"
              />
            ) : null}
            <p
              id={titleId}
              className={`truncate text-sm font-semibold text-slate-900 ${logoUrl ? "sr-only" : ""}`}
            >
              {siteName}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-lg leading-none text-slate-600 transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {dict.common.search}
            </p>
            <CommandPalette
              locale={locale}
              dict={dict}
              variant="compact"
              fullWidth
              enableHotkey={false}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {dict.common.language}
            </p>
            <LanguageSwitcher
              currentLocale={locale}
              label={dict.common.language}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {dict.common.quickAccess}
            </p>
            <QuickAccessMenu locale={locale} dict={dict} variant="inline" />
          </div>

          <nav className="space-y-1 border-t border-slate-100 pt-4">
            <Link
              href={`/${locale}`}
              onClick={onClose}
              className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              {dict.common.home}
            </Link>

            {toolCategories.map((cat) => {
              const tools = toolsByCategory(cat);
              if (!tools.length) return null;
              const expanded = mobileCat === cat;
              const style = categoryStyles[cat];
              return (
                <div key={cat}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setMobileCat(expanded ? null : cat)}
                    className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-sm font-semibold ${style.text} hover:bg-slate-50`}
                  >
                    <span>{dict.categories[cat]}</span>
                    <span aria-hidden>{expanded ? "▴" : "▾"}</span>
                  </button>
                  {expanded ? (
                    <ul className="mb-2 ms-2 space-y-0.5 border-s border-slate-100 ps-2">
                      <li>
                        <Link
                          href={`/${locale}/categories/${cat}`}
                          onClick={onClose}
                          className="flex min-h-10 items-center rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-50"
                        >
                          {dict.common.allTools}
                        </Link>
                      </li>
                      {tools.map((tool) => (
                        <li key={tool.slug}>
                          <Link
                            href={`/${locale}/tools/${tool.slug}`}
                            onClick={onClose}
                            className="flex min-h-10 items-center rounded-lg px-3 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {dict.tools[tool.dictKey].title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}

            <Link
              href={`/${locale}/about`}
              onClick={onClose}
              className="mt-2 flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              {dict.common.about}
            </Link>
          </nav>
        </div>

        <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
          {toolRegistry.length} {dict.common.tools.toLowerCase()}
        </p>
      </div>
    </div>,
    document.body,
  );
}
