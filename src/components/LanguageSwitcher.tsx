"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { locales, type Locale } from "@/lib/i18n";

const labels: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
};

type LanguageSwitcherProps = {
  currentLocale: Locale;
  label: string;
};

function LanguageSwitcherInner({
  currentLocale,
  label,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchLocale(next: Locale): string {
    const segments = pathname.split("/");
    if (segments.length > 1) {
      segments[1] = next;
    }
    const base = segments.join("/") || `/${next}`;
    const query = searchParams.toString();
    const hash =
      typeof window !== "undefined" ? window.location.hash : "";
    return `${base}${query ? `?${query}` : ""}${hash}`;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="hidden text-zinc-500 sm:inline dark:text-zinc-400">
        {label}
      </span>
      <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
        {locales.map((locale) => {
          const active = locale === currentLocale;
          return (
            <Link
              key={locale}
              href={switchLocale(locale)}
              className={`rounded-full px-2.5 py-1 font-medium transition ${
                active
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
              hrefLang={locale}
              aria-current={active ? "true" : undefined}
              prefetch={false}
            >
              {labels[locale]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function LanguageSwitcher(props: LanguageSwitcherProps) {
  return (
    <Suspense fallback={<div className="h-8 w-28 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />}>
      <LanguageSwitcherInner {...props} />
    </Suspense>
  );
}
