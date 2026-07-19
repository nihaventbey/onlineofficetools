"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CommandPalette from "@/components/CommandPalette";
import type { Dictionary, Locale } from "@/lib/i18n";
import { categoryStyles, toolCategories } from "@/lib/tools/categories";
import { toolRegistry, toolsByCategory } from "@/lib/tools/registry";

type HeaderProps = {
  locale: Locale;
  dict: Dictionary;
  logoUrl?: string | null;
};

export default function Header({ locale, dict, logoUrl }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileCat, setMobileCat] = useState<string | null>(null);
  const megaRef = useRef<HTMLDivElement>(null);

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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            href={`/${locale}`}
            className="group flex min-w-0 items-center gap-2.5"
            onClick={() => {
              setMobileOpen(false);
              setMegaOpen(false);
            }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={dict.common.siteName}
                className="h-8 max-w-40 shrink-0 object-contain sm:h-9"
              />
            ) : null}
            <span className="min-w-0">
              <span className="block truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                {dict.common.siteName}
              </span>
              <span className="mt-0.5 hidden text-xs text-slate-500 md:block">
                {dict.common.siteTagline}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            <div className="relative" ref={megaRef}>
              <button
                type="button"
                aria-expanded={megaOpen}
                aria-controls="tools-mega-menu"
                onClick={() => setMegaOpen((v) => !v)}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition ${
                  megaOpen
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                {dict.common.allTools}
                <span aria-hidden className={`transition ${megaOpen ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>

              {megaOpen ? (
                <div
                  id="tools-mega-menu"
                  className="absolute left-0 top-full z-50 mt-2 w-[min(94vw,64rem)] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
                >
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {toolCategories.map((cat) => {
                      const tools = toolsByCategory(cat);
                      if (!tools.length) return null;
                      const style = categoryStyles[cat];
                      return (
                        <div key={cat}>
                          <Link
                            href={`/${locale}/categories/${cat}`}
                            onClick={() => setMegaOpen(false)}
                            className={`mb-2 inline-flex text-xs font-bold uppercase tracking-wide ${style.text}`}
                          >
                            {dict.categories[cat]}
                          </Link>
                          <ul className="space-y-0.5">
                            {tools.slice(0, 6).map((tool) => (
                              <li key={tool.slug}>
                                <Link
                                  href={`/${locale}/tools/${tool.slug}`}
                                  onClick={() => setMegaOpen(false)}
                                  className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                                >
                                  <span
                                    className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold ${style.bg} ${style.text}`}
                                  >
                                    {tool.icon}
                                  </span>
                                  {dict.tools[tool.dictKey].title}
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

            {toolCategories.slice(0, 6).map((cat) => {
              const style = categoryStyles[cat];
              return (
                <Link
                  key={cat}
                  href={`/${locale}/categories/${cat}`}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold ${style.text} hover:bg-slate-50`}
                >
                  {dict.categories[cat]}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <CommandPalette locale={locale} dict={dict} />
          <LanguageSwitcher
            currentLocale={locale}
            label={dict.common.language}
          />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 xl:hidden"
            aria-expanded={mobileOpen}
            aria-label={dict.common.allTools}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="flex flex-col gap-1.5">
              <span className={`h-0.5 w-4 bg-slate-800 transition ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-4 bg-slate-800 transition ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`h-0.5 w-4 bg-slate-800 transition ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="max-h-[70vh] overflow-y-auto border-t border-slate-200 bg-white px-4 py-4 xl:hidden">
          <nav className="flex flex-col gap-1 text-sm font-medium">
            <Link
              href={`/${locale}`}
              onClick={() => setMobileOpen(false)}
              className="min-h-11 rounded-lg px-3 py-2 hover:bg-slate-100"
            >
              {dict.common.home}
            </Link>
            {toolCategories.map((cat) => {
              const tools = toolsByCategory(cat);
              if (!tools.length) return null;
              const open = mobileCat === cat;
              const style = categoryStyles[cat];
              return (
                <div key={cat}>
                  <button
                    type="button"
                    onClick={() => setMobileCat(open ? null : cat)}
                    className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 ${style.text}`}
                  >
                    <span className="font-semibold">{dict.categories[cat]}</span>
                    <span>{open ? "▴" : "▾"}</span>
                  </button>
                  {open ? (
                    <ul className="mb-2 ml-2 space-y-0.5 border-l border-slate-100 pl-2">
                      <li>
                        <Link
                          href={`/${locale}/categories/${cat}`}
                          onClick={() => setMobileOpen(false)}
                          className="block min-h-10 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50"
                        >
                          {dict.common.allTools}
                        </Link>
                      </li>
                      {tools.map((tool) => (
                        <li key={tool.slug}>
                          <Link
                            href={`/${locale}/tools/${tool.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className="block min-h-10 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
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
              onClick={() => setMobileOpen(false)}
              className="mt-2 min-h-11 rounded-lg px-3 py-2 hover:bg-slate-100"
            >
              {dict.common.about}
            </Link>
          </nav>
          <p className="mt-3 px-3 text-xs text-slate-400">
            {toolRegistry.length} {dict.common.tools.toLowerCase()}
          </p>
        </div>
      ) : null}
    </header>
  );
}
