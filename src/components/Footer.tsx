import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { toolCategories } from "@/lib/tools/categories";

type FooterProps = {
  locale: Locale;
  dict: Dictionary;
};

export default function Footer({ locale, dict }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <p className="text-base font-semibold text-zinc-900 dark:text-white">
            {dict.common.siteName}
          </p>
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {dict.common.siteTagline}
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {dict.common.categories}
          </p>
          <ul className="space-y-2 text-sm">
            {toolCategories.map((cat) => (
              <li key={cat}>
                <Link
                  href={`/${locale}#category-${cat}`}
                  className="text-zinc-700 hover:text-violet-600 dark:text-zinc-300"
                >
                  {dict.categories[cat]}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={`/${locale}#tools`}
                className="text-zinc-700 hover:text-violet-600 dark:text-zinc-300"
              >
                {dict.common.allTools}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {dict.common.about}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={`/${locale}/about`} className="text-zinc-700 hover:text-violet-600 dark:text-zinc-300">
                {dict.common.about}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/contact`} className="text-zinc-700 hover:text-violet-600 dark:text-zinc-300">
                {dict.common.contact}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {dict.common.legal}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={`/${locale}/privacy`} className="text-zinc-700 hover:text-violet-600 dark:text-zinc-300">
                {dict.common.privacy}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/terms`} className="text-zinc-700 hover:text-violet-600 dark:text-zinc-300">
                {dict.common.terms}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-800">
        <p className="mx-auto max-w-6xl px-4 py-4 text-sm text-zinc-500 sm:px-6 dark:text-zinc-400">
          © {year} {dict.common.siteName}. {dict.common.footerRights}
        </p>
      </div>
    </footer>
  );
}
