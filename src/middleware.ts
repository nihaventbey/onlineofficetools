import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isLocale, type Locale } from "@/lib/locales";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { renderMarkdownForRequest } from "@/lib/agents/markdownNegotiation";

const AGENT_LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</.well-known/ai-catalog.json>; rel="service-desc"',
  '</.well-known/agent-skills/index.json>; rel="agent-skills"',
  '</.well-known/mcp/server-card.json>; rel="mcp-server-card"',
  '</.well-known/poppy.json>; rel="poppy-manifest"',
  '</.well-known/oauth-authorization-server>; rel="oauth-authorization-server"',
  '</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"',
  '</auth.md>; rel="auth-md"',
  '</auth.md>; rel="service-doc"',
].join(", ");

/**
 * Locale redirects + admin session refresh.
 * Cloudflare: CF-IPCountry. Vercel: x-vercel-ip-country.
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

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|pinterest|redditbot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|bytespider|gptbot|claudebot|perplexity/i.test(
    userAgent,
  );
}

function detectLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && isLocale(cookie)) return cookie;

  if (isCrawler(request.headers.get("user-agent"))) {
    return defaultLocale;
  }

  const country = (
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country") ??
    ""
  ).toUpperCase();
  const byCountry = countryToLocale[country];
  if (byCountry) return byCountry;

  return (
    localeFromAcceptLanguage(request.headers.get("accept-language")) ??
    defaultLocale
  );
}

const ADMIN_LOGIN_PATH = "/admin/login";

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
  request.headers.set("x-pathname", pathname);

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

export async function middleware(
  request: NextRequest,
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return handleAdminRoute(request);
  }

  // Markdown for Agents (Accept: text/markdown negotiation)
  const acceptHeader = request.headers.get("accept") || "";
  if (acceptHeader.includes("text/markdown")) {
    const md = renderMarkdownForRequest(pathname);
    const tokens = Math.ceil(md.length / 4);
    return new NextResponse(md, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "x-markdown-tokens": String(tokens),
        Vary: "Accept",
        Link: AGENT_LINK_HEADER,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  }

  const firstSegment = pathname.split("/")[1] ?? "";
  if (isLocale(firstSegment)) {
    const legacy = ebysLegacyRedirect(request, firstSegment);
    if (legacy) return legacy;
    const response = NextResponse.next();
    response.headers.set("Link", AGENT_LINK_HEADER);
    return response;
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const status = isCrawler(request.headers.get("user-agent")) ? 308 : 307;
  const redirectResponse = NextResponse.redirect(url, status);
  redirectResponse.headers.set("Link", AGENT_LINK_HEADER);
  return redirectResponse;
}

export default middleware;

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
