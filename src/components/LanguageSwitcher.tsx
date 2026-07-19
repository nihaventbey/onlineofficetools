"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { isLocale, localeNames, locales, type Locale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  currentLocale: Locale;
  label: string;
  fullWidth?: boolean;
};

function LanguageSwitcherInner({
  currentLocale,
  label,
  fullWidth = false,
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
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;samesite=lax`;
    router.push(`${base}${query ? `?${query}` : ""}${hash}`);
  }

  return (
    <label
      className={`flex items-center gap-2 text-sm ${fullWidth ? "w-full" : ""}`}
    >
      <span className="sr-only">{label}</span>
      {!fullWidth ? (
        <span aria-hidden className="hidden text-slate-400 lg:inline">
          🌐
        </span>
      ) : null}
      <select
        value={currentLocale}
        onChange={(e) => {
          const next = e.target.value;
          if (isLocale(next)) switchLocale(next);
        }}
        className={`h-11 cursor-pointer rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 outline-none transition hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 ${
          fullWidth ? "w-full" : "max-w-[9rem]"
        }`}
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
      fallback={
        <div
          className={`h-11 animate-pulse rounded-xl bg-slate-100 ${
            props.fullWidth ? "w-full" : "w-28"
          }`}
        />
      }
    >
      <LanguageSwitcherInner {...props} />
    </Suspense>
  );
}
