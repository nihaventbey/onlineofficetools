"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CommandPalette from "@/components/CommandPalette";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import QuickAccessMenu from "@/components/tools/QuickAccessMenu";
import type { Dictionary, Locale } from "@/lib/i18n";
import { categoryStyles, toolCategories } from "@/lib/tools/categories";
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
  const megaRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMegaOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        {dict.common.skipToContent}
      </a>

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        {/* Brand lockup: logo alone when CMS logo exists; text fallback otherwise */}
        <div className="flex min-w-0 flex-1 items-center gap-3 xl:gap-5">
          <Link
            href={`/${locale}`}
            className="group flex min-w-0 shrink items-center gap-2.5"
            aria-label={brandName}
            onClick={() => {
              setMobileOpen(false);
              setMegaOpen(false);
            }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={brandName}
                className="h-[30px] w-auto max-w-[7.5rem] object-contain object-left sm:h-[38px] sm:max-w-[9.5rem]"
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
            <div className="relative" ref={megaRef}>
              <button
                type="button"
                aria-expanded={megaOpen}
                aria-controls="tools-mega-menu"
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

              {megaOpen ? (
                <div
                  id="tools-mega-menu"
                  className="absolute left-0 top-full z-50 mt-2 w-[min(94vw,64rem)] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
                >
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {toolCategories.map((cat) => {
                      const tools = toolsByCategory(cat);
                      if (!tools.length) return null;
                      const style = categoryStyles[cat];
                      return (
                        <div key={cat}>
                          <Link
                            href={`/${locale}/categories/${cat}`}
                            onClick={() => setMegaOpen(false)}
                            className={`mb-1.5 inline-flex min-h-9 items-center text-xs font-bold uppercase tracking-wide ${style.text}`}
                          >
                            {dict.categories[cat]}
                          </Link>
                          <ul className="space-y-0.5">
                            {tools.slice(0, 6).map((tool) => (
                              <li key={tool.slug}>
                                <Link
                                  href={`/${locale}/tools/${tool.slug}`}
                                  onClick={() => setMegaOpen(false)}
                                  className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-blue-700"
                                >
                                  <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${style.bg} ${style.text}`}
                                  >
                                    {tool.icon}
                                  </span>
                                  <span className="truncate">
                                    {dict.tools[tool.dictKey].title}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

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

        {/* Actions: progressive disclosure by breakpoint */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <CommandPalette locale={locale} dict={dict} variant="responsive" />

          {/* Tablet+: quick access in header; mobile uses drawer */}
          <div className="hidden md:block">
            <QuickAccessMenu locale={locale} dict={dict} compact />
          </div>

          {/* Tablet+: language in header; mobile uses drawer */}
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
