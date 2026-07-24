"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CommandPalette from "@/components/CommandPalette";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import QuickAccessMenu from "@/components/tools/QuickAccessMenu";
import type { Dictionary, Locale } from "@/lib/i18n";
import {
  categoryStyles,
  type ToolCategory,
  visibleCategories,
} from "@/lib/tools/categories";
import { toolsByCategory } from "@/lib/tools/registry";

type HeaderProps = {
  locale: Locale;
  dict: Dictionary;
  logoUrl?: string | null;
  siteName?: string;
  siteTagline?: string;
};

/** Primary categories shown in the desktop top nav (rest live in mega menu / drawer). */
const DESKTOP_NAV_CATEGORIES = [
  "text",
  "documents",
  "pdf",
  "image",
  "video",
  "audio",
  "calculator",
] as const;

export default function Header({
  locale,
  dict,
  logoUrl,
  siteName,
  siteTagline,
}: HeaderProps) {
  const brandName = siteName?.trim() || dict.common.siteName;
  const brandTagline = siteTagline?.trim() || dict.common.siteTagline;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [megaCat, setMegaCat] = useState<ToolCategory | null>(null);
  const [mounted, setMounted] = useState(false);
  const megaButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const megaTitleId = useId();
  const categories = visibleCategories(locale);
  const activeCat =
    megaCat && categories.includes(megaCat) ? megaCat : categories[0] ?? null;
  const activeTools = activeCat ? toolsByCategory(activeCat) : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!megaOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [megaOpen]);

  useEffect(() => {
    if (!megaOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMegaOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [megaOpen]);

  function closeMega() {
    setMegaOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        {dict.common.skipToContent}
      </a>

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 xl:gap-5">
          <Link
            href={`/${locale}`}
            className="group flex min-w-0 shrink items-center gap-2.5"
            aria-label={brandName}
            onClick={() => {
              setMobileOpen(false);
              closeMega();
            }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={brandName}
                className="h-9 w-auto max-w-[10rem] object-contain object-left sm:h-11 sm:max-w-[13rem]"
              />
            ) : (
              <span className="min-w-0">
                <span className="block truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                  {brandName}
                </span>
                <span className="mt-0.5 hidden truncate text-xs text-slate-500 lg:block">
                  {brandTagline}
                </span>
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            <button
              ref={megaButtonRef}
              type="button"
              aria-expanded={megaOpen}
              aria-controls="tools-mega-menu"
              aria-haspopup="dialog"
              onClick={() => setMegaOpen((v) => !v)}
              className={`inline-flex h-11 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                megaOpen
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              {dict.common.allTools}
              <span
                aria-hidden
                className={`text-[10px] transition ${megaOpen ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </button>

            {DESKTOP_NAV_CATEGORIES.map((cat) => {
              const style = categoryStyles[cat];
              return (
                <Link
                  key={cat}
                  href={`/${locale}/categories/${cat}`}
                  className={`inline-flex h-11 items-center rounded-xl px-2.5 text-xs font-semibold transition hover:bg-slate-50 ${style.text}`}
                >
                  {dict.categories[cat]}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <CommandPalette locale={locale} dict={dict} variant="responsive" />

          <div className="hidden md:block">
            <QuickAccessMenu locale={locale} dict={dict} compact />
          </div>

          <div className="hidden md:block">
            <LanguageSwitcher
              currentLocale={locale}
              label={dict.common.language}
            />
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 transition hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 xl:hidden"
            aria-expanded={mobileOpen}
            aria-label={dict.common.allTools}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="flex flex-col gap-1.5" aria-hidden>
              <span
                className={`h-0.5 w-4 bg-current transition ${mobileOpen ? "translate-y-2 rotate-45" : ""}`}
              />
              <span
                className={`h-0.5 w-4 bg-current transition ${mobileOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`h-0.5 w-4 bg-current transition ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>

      {mounted && megaOpen
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px]"
                onClick={closeMega}
              />
              <div
                ref={panelRef}
                id="tools-mega-menu"
                role="dialog"
                aria-modal="true"
                aria-labelledby={megaTitleId}
                className="fixed inset-x-0 top-14 z-50 flex max-h-[calc(100dvh-3.5rem)] flex-col border-b border-slate-200 bg-white shadow-xl sm:top-16 sm:max-h-[calc(100dvh-4rem)]"
              >
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6 lg:px-8">
                  <h2
                    id={megaTitleId}
                    className="text-sm font-semibold text-slate-900"
                  >
                    {dict.common.allTools}
                  </h2>
                  <button
                    type="button"
                    onClick={closeMega}
                    aria-label="Close menu"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    ✕
                  </button>
                </div>
                <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 grid-cols-1 overflow-hidden md:grid-cols-[14rem_1fr]">
                  <aside className="max-h-[40vh] overflow-y-auto border-b border-slate-100 p-3 md:max-h-none md:border-b-0 md:border-r">
                    <ul className="space-y-0.5">
                      {categories.map((cat) => {
                        if (!toolsByCategory(cat).length) return null;
                        const style = categoryStyles[cat];
                        const selected = cat === activeCat;
                        return (
                          <li key={cat}>
                            <button
                              type="button"
                              onClick={() => setMegaCat(cat)}
                              className={`flex w-full min-h-10 items-center rounded-xl px-3 text-left text-sm font-semibold transition ${
                                selected
                                  ? `${style.bg} ${style.text}`
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {dict.categories[cat]}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </aside>
                  <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
                    {activeCat ? (
                      <>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p
                            className={`text-xs font-bold uppercase tracking-wide ${categoryStyles[activeCat].text}`}
                          >
                            {dict.categories[activeCat]}
                          </p>
                          <Link
                            href={`/${locale}/categories/${activeCat}`}
                            onClick={closeMega}
                            className="text-sm font-medium text-blue-700 hover:underline"
                          >
                            {dict.common.categoryTools}
                          </Link>
                        </div>
                        <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                          {activeTools.map((tool) => {
                            const style = categoryStyles[activeCat];
                            return (
                              <li key={tool.slug}>
                                <Link
                                  href={`/${locale}/tools/${tool.slug}`}
                                  onClick={closeMega}
                                  className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-blue-700"
                                >
                                  <span
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${style.bg} ${style.text}`}
                                  >
                                    {tool.icon}
                                  </span>
                                  <span className="truncate">
                                    {dict.tools[tool.dictKey].title}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}

      <MobileNavDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        locale={locale}
        dict={dict}
        siteName={brandName}
        logoUrl={logoUrl}
        menuButtonRef={menuButtonRef}
      />
    </header>
  );
}
