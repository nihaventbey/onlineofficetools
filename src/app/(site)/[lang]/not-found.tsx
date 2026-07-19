"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getDictionary, isLocale, type Dictionary, type Locale } from "@/lib/i18n";

export default function NotFound() {
  const pathname = usePathname();
  const segment = pathname?.split("/")[1] ?? "en";
  const locale = (isLocale(segment) ? segment : "en") as Locale;
  const [dict, setDict] = useState<Dictionary | null>(null);

  useEffect(() => {
    void getDictionary(locale).then(setDict);
  }, [locale]);

  if (!dict) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-12 text-sm text-slate-500">
        …
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-start justify-center gap-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
        404
      </p>
      <h1 className="text-3xl font-bold tracking-tight">
        {dict.common.notFoundTitle}
      </h1>
      <p className="max-w-md text-zinc-600">{dict.common.notFoundBody}</p>
      <Link
        href={`/${locale}`}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
      >
        {dict.common.notFoundCta}
      </Link>
    </div>
  );
}
