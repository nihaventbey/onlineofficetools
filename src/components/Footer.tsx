import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { visibleCategories } from "@/lib/tools/categories";

type FooterProps = {
  locale: Locale;
  dict: Dictionary;
};

export default function Footer({ locale, dict }: FooterProps) {
  const year = new Date().getFullYear();
  const categories = visibleCategories(locale);

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <p className="text-base font-semibold text-slate-900">
            {dict.common.siteName}
          </p>
          <p className="text-sm leading-relaxed text-slate-500">
            {dict.common.siteTagline}
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {dict.common.categories}
          </p>
          <ul className="space-y-2 text-sm">
            {categories.map((cat) => (
              <li key={cat}>
                <Link
                  href={`/${locale}/categories/${cat}`}
                  className="text-slate-700 hover:text-blue-600"
                >
                  {dict.categories[cat]}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={`/${locale}#tools`}
                className="text-slate-700 hover:text-blue-600"
              >
                {dict.common.allTools}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {dict.common.about}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={`/${locale}/about`} className="text-slate-700 hover:text-blue-600">
                {dict.common.about}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/contact`} className="text-slate-700 hover:text-blue-600">
                {dict.common.contact}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {dict.common.legal}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={`/${locale}/privacy`} className="text-slate-700 hover:text-blue-600">
                {dict.common.privacy}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/terms`} className="text-slate-700 hover:text-blue-600">
                {dict.common.terms}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <p className="mx-auto max-w-7xl px-4 py-4 text-sm text-slate-500 sm:px-6 lg:px-8">
          © {year} {dict.common.siteName}. {dict.common.footerRights}
        </p>
      </div>
    </footer>
  );
}
