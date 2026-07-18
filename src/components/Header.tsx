import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { Dictionary, Locale } from "@/lib/i18n";

type HeaderProps = {
  locale: Locale;
  dict: Dictionary;
};

export default function Header({ locale, dict }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}`} className="group">
            <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
              {dict.common.siteName}
            </span>
            <span className="mt-0.5 block text-xs text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400">
              {dict.common.siteTagline}
            </span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-zinc-600 sm:flex dark:text-zinc-300">
            <Link
              href={`/${locale}`}
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              {dict.common.home}
            </Link>
            <Link
              href={`/${locale}#tools`}
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              {dict.common.tools}
            </Link>
          </nav>
        </div>
        <LanguageSwitcher
          currentLocale={locale}
          label={dict.common.language}
        />
      </div>
    </header>
  );
}
