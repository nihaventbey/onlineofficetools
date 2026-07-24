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

/** Quick category links in the top bar (All tools covers the rest). */
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
  const activeStyle = activeCat ? categoryStyles[activeCat] : null;

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

  function openMega() {
    setMobileOpen(false);
    setMegaOpen(true);
  }

  const countLabel = (n: number) =>
    dict.common.categoryTools.replace("{count}", String(n));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        {dict.common.skipToContent}
      </a>

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 xl:gap-5">
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

          {/* All tools: visible from md+ (mega panel is responsive) */}
          <button
            ref={megaButtonRef}
            type="button"
            aria-expanded={megaOpen}
            aria-controls="tools-mega-menu"
            aria-haspopup="dialog"
            onClick={() => (megaOpen ? closeMega() : openMega())}
            className={`hidden items-center gap-1.5 rounded-xl px-3 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 md:inline-flex md:h-10 lg:h-11 lg:px-3.5 ${
              megaOpen
                ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-blue-200"
                : "border border-blue-100 bg-gradient-to-b from-blue-50 to-sky-50/80 text-blue-800 hover:border-blue-200 hover:from-blue-100 hover:to-sky-50"
            }`}
          >
            <span
              aria-hidden
              className="flex h-5 w-5 items-center justify-center rounded-md bg-white/25 text-[10px]"
            >
              ⊞
            </span>
            {dict.common.allTools}
            <span
              aria-hidden
              className={`text-[10px] opacity-80 transition ${megaOpen ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </button>

          <nav className="hidden items-center gap-0.5 xl:flex">
            {DESKTOP_NAV_CATEGORIES.map((cat) => {
              const style = categoryStyles[cat];
              return (
                <Link
                  key={cat}
                  href={`/${locale}/categories/${cat}`}
                  className={`inline-flex h-10 items-center rounded-lg px-2 text-xs font-semibold transition hover:bg-slate-50 ${style.text}`}
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 transition hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 md:hidden"
            aria-expanded={mobileOpen}
            aria-label={dict.common.allTools}
            onClick={() => {
              closeMega();
              setMobileOpen((v) => !v);
            }}
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
                aria-label={dict.common.closeMenu}
                className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition"
                onClick={closeMega}
              />
              <div
                ref={panelRef}
                id="tools-mega-menu"
                role="dialog"
                aria-modal="true"
                aria-labelledby={megaTitleId}
                className="fixed inset-x-0 top-14 z-50 flex max-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden border-b border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 sm:top-16 sm:max-h-[calc(100dvh-4rem)] sm:rounded-b-3xl sm:border-x sm:mx-auto sm:max-w-7xl lg:max-w-[min(96vw,80rem)]"
              >
                <div
                  className={`relative overflow-hidden border-b border-slate-100 px-4 py-4 sm:px-6 lg:px-8 ${
                    activeStyle?.heroGradient ?? "bg-gradient-to-br from-slate-50 to-white"
                  }`}
                >
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full blur-2xl ${activeStyle?.heroBlob ?? "bg-blue-200/40"}`}
                  />
                  <div className="relative flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2
                        id={megaTitleId}
                        className="text-lg font-semibold tracking-tight text-slate-900"
                      >
                        {dict.common.allTools}
                      </h2>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {dict.common.menuToolsHint}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeMega}
                      aria-label={dict.common.closeMenu}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/80 bg-white/90 px-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-white"
                    >
                      <span aria-hidden>×</span>
                      <span className="hidden sm:inline">{dict.common.closeMenu}</span>
                    </button>
                  </div>
                </div>

                {/* Category chips — always scrollable for narrow widths */}
                <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2.5 sm:px-5">
                  <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {dict.common.browseCategories}
                  </p>
                  <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
                    {categories.map((cat) => {
                      const tools = toolsByCategory(cat);
                      if (!tools.length) return null;
                      const style = categoryStyles[cat];
                      const selected = cat === activeCat;
                      return (
                        <li key={cat} className="shrink-0">
                          <button
                            type="button"
                            onClick={() => setMegaCat(cat)}
                            className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition ${
                              selected
                                ? `${style.bg} ${style.text} ${style.border} border shadow-md`
                                : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${style.bg} ${style.text}`}
                            >
                              {tools[0]?.emoji ?? "•"}
                            </span>
                            {dict.categories[cat]}
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                                selected
                                  ? "bg-white/70 text-slate-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {tools.length}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-white to-slate-50/60 p-4 sm:p-5 lg:p-6">
                  {activeCat && activeStyle ? (
                    <>
                      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p
                            className={`text-xs font-bold uppercase tracking-wider ${activeStyle.text}`}
                          >
                            {dict.categories[activeCat]}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {countLabel(activeTools.length)}
                          </p>
                        </div>
                        <Link
                          href={`/${locale}/categories/${activeCat}`}
                          onClick={closeMega}
                          className={`inline-flex min-h-10 items-center rounded-xl border px-3 text-sm font-semibold transition hover:shadow-sm ${activeStyle.border} ${activeStyle.bg} ${activeStyle.text}`}
                        >
                          {dict.common.viewCategory}
                          <span aria-hidden className="ms-1">
                            →
                          </span>
                        </Link>
                      </div>
                      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {activeTools.map((tool) => (
                          <li key={tool.slug}>
                            <Link
                              href={`/${locale}/tools/${tool.slug}`}
                              onClick={closeMega}
                              className={`group flex min-h-[3.25rem] items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${activeStyle.ring}`}
                            >
                              <span
                                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-inner ${activeStyle.bg} ${activeStyle.text}`}
                              >
                                <span aria-hidden className="text-base leading-none">
                                  {tool.emoji}
                                </span>
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-1.5">
                                  <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                                    {dict.tools[tool.dictKey].title}
                                  </span>
                                  {tool.badge === "new" ? (
                                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                      {dict.common.newBadge}
                                    </span>
                                  ) : null}
                                  {tool.badge === "popular" ? (
                                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                                      {dict.common.popularBadge}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500">
                                  {dict.tools[tool.dictKey].description}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
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
