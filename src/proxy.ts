import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n";

/**
 * Maps visitor country (Vercel geo header) to a site locale.
 * Only used when the user has no explicit NEXT_LOCALE cookie.
 */
const countryToLocale: Record<string, Locale> = {
  TR: "tr",
  CY: "tr",
  DE: "de",
  AT: "de",
  CH: "de",
  FR: "fr",
  BE: "fr",
  LU: "fr",
  MC: "fr",
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  VE: "es",
  EC: "es",
  UY: "es",
  IT: "it",
  SM: "it",
  PT: "pt",
  BR: "pt",
  AO: "pt",
  MZ: "pt",
  RU: "ru",
  BY: "ru",
  KZ: "ru",
  KG: "ru",
};

function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const entries = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of entries) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}

function detectLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && isLocale(cookie)) return cookie;

  const country =
    request.headers.get("x-vercel-ip-country")?.toUpperCase() ?? "";
  const byCountry = countryToLocale[country];
  if (byCountry) return byCountry;

  return (
    localeFromAcceptLanguage(request.headers.get("accept-language")) ??
    defaultLocale
  );
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firstSegment = pathname.split("/")[1] ?? "";
  if (isLocale(firstSegment)) {
    return NextResponse.next();
  }

  // Path has no locale prefix (e.g. "/" or "/tools/word-counter"):
  // send the visitor to their detected language.
  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  // 307 (temporary): the target depends on the visitor, so it must not be cached.
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: [
    // Skip static assets, Next internals, the admin panel, and SEO files.
    "/((?!_next|admin|api|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
