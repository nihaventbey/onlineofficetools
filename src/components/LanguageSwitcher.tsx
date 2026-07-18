"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";

const labels: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
};

type LanguageSwitcherProps = {
  currentLocale: Locale;
  label: string;
};

export default function LanguageSwitcher({
  currentLocale,
  label,
}: LanguageSwitcherProps) {
  const pathname = usePathname();

  function switchLocale(next: Locale): string {
    const segments = pathname.split("/");
    if (segments.length > 1) {
      segments[1] = next;
      return segments.join("/") || `/${next}`;
    }
    return `/${next}`;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
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
            >
              {labels[locale]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
