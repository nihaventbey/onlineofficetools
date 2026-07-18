"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { isLocale, localeNames, locales, type Locale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  currentLocale: Locale;
  label: string;
};

function LanguageSwitcherInner({
  currentLocale,
  label,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchLocale(next: Locale) {
    const segments = pathname.split("/");
    if (segments.length > 1) {
      segments[1] = next;
    }
    const base = segments.join("/") || `/${next}`;
    const query = searchParams.toString();
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    // Remember the explicit choice so geo-detection doesn't override it.
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;samesite=lax`;
    router.push(`${base}${query ? `?${query}` : ""}${hash}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{label}</span>
      <span aria-hidden className="hidden text-slate-400 sm:inline">
        🌐
      </span>
      <select
        value={currentLocale}
        onChange={(e) => {
          const next = e.target.value;
          if (isLocale(next)) switchLocale(next);
        }}
        className="h-9 max-w-[9rem] cursor-pointer rounded-xl border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 outline-none transition hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
        aria-label={label}
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function LanguageSwitcher(props: LanguageSwitcherProps) {
  return (
    <Suspense
      fallback={<div className="h-9 w-28 animate-pulse rounded-xl bg-slate-100" />}
    >
      <LanguageSwitcherInner {...props} />
    </Suspense>
  );
}
