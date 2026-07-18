"use client";

import Link from "next/link";
import { useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { Dictionary, Locale } from "@/lib/i18n";
import { toolCategories } from "@/lib/tools/categories";

type HeaderProps = {
  locale: Locale;
  dict: Dictionary;
};

export default function Header({ locale, dict }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}`} className="group" onClick={() => setOpen(false)}>
            <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
              {dict.common.siteName}
            </span>
            <span className="mt-0.5 hidden text-xs text-zinc-500 group-hover:text-zinc-700 sm:block dark:text-zinc-400">
              {dict.common.siteTagline}
            </span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium text-zinc-600 lg:flex dark:text-zinc-300">
            <Link
              href={`/${locale}`}
              className="rounded-lg px-2.5 py-1.5 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              {dict.common.home}
            </Link>
            <div className="group relative">
              <button
                type="button"
                className="rounded-lg px-2.5 py-1.5 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                {dict.common.categories}
              </button>
              <div className="invisible absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-zinc-200 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-900">
                {toolCategories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/${locale}#category-${cat}`}
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {dict.categories[cat]}
                  </Link>
                ))}
                <Link
                  href={`/${locale}#tools`}
                  className="mt-1 block rounded-lg px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/40"
                >
                  {dict.common.allTools}
                </Link>
              </div>
            </div>
            <Link
              href={`/${locale}/about`}
              className="rounded-lg px-2.5 py-1.5 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              {dict.common.about}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher
            currentLocale={locale}
            label={dict.common.language}
          />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 lg:hidden dark:border-zinc-700"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <span className="flex flex-col gap-1.5">
              <span className={`h-0.5 w-4 bg-zinc-800 transition dark:bg-zinc-200 ${open ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-4 bg-zinc-800 transition dark:bg-zinc-200 ${open ? "opacity-0" : ""}`} />
              <span className={`h-0.5 w-4 bg-zinc-800 transition dark:bg-zinc-200 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <nav className="flex flex-col gap-1 text-sm font-medium">
            <Link href={`/${locale}`} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900">
              {dict.common.home}
            </Link>
            <Link href={`/${locale}#tools`} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900">
              {dict.common.allTools}
            </Link>
            {toolCategories.map((cat) => (
              <Link
                key={cat}
                href={`/${locale}#category-${cat}`}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                {dict.categories[cat]}
              </Link>
            ))}
            <Link href={`/${locale}/about`} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900">
              {dict.common.about}
            </Link>
            <Link href={`/${locale}/contact`} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900">
              {dict.common.contact}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
