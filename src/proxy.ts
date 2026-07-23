import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

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

const ADMIN_LOGIN_PATH = "/admin/login";

/** Retired EBYS slugs → home (module deactivated). */
const EBYS_LEGACY_REDIRECTS: Record<string, string> = {
  "/tools/arz-rica": "/",
  "/tools/sdp-arama": "/",
  "/tools/detsis": "/",
  "/tools/belgenet-html": "/",
  "/tools/belgenet-hazirlik": "/",
  "/categories/ebys": "/",
};

function ebysLegacyRedirect(
  request: NextRequest,
  locale: string,
): NextResponse | null {
  if (locale !== "tr") return null;
  const suffix = request.nextUrl.pathname.slice(`/${locale}`.length);
  const target = EBYS_LEGACY_REDIRECTS[suffix];
  if (!target) return null;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${target === "/" ? "" : target}`;
  if (url.pathname === `/${locale}`) url.pathname = `/${locale}`;
  url.search = "";
  return NextResponse.redirect(url, 308);
}

async function handleAdminRoute(
  request: NextRequest,
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Forward the current pathname to Server Components (e.g. the admin
  // layout guard) so they can tell the login page apart from the rest of
  // the admin panel without re-parsing the URL.
  request.headers.set("x-pathname", pathname);

  // Refresh the Supabase session cookies on every admin request so the
  // access token doesn't silently expire mid-session.
  const { response, user } = await updateSupabaseSession(request);

  if (pathname === ADMIN_LOGIN_PATH) {
    return response;
  }

  const role = user?.app_metadata?.role;
  if (!user || role !== "admin") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN_PATH;
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl, 307);
  }

  return response;
}

export default function proxy(
  request: NextRequest,
): NextResponse | Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return handleAdminRoute(request);
  }

  const firstSegment = pathname.split("/")[1] ?? "";
  if (isLocale(firstSegment)) {
    const legacy = ebysLegacyRedirect(request, firstSegment);
    if (legacy) return legacy;
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
    // Run on the admin panel (session refresh + auth guard) and on the
    // public site for locale redirects. Skip Next internals, the API,
    // and static/SEO files everywhere.
    "/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
