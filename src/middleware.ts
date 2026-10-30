import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isLocale, type Locale } from "@/lib/locales";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { renderMarkdownForRequest } from "@/lib/agents/markdownNegotiation";

const AGENT_LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</.well-known/ai-catalog.json>; rel="service-desc"',
  '</.well-known/agent-skills/index.json>; rel="agent-skills"',
  '</.well-known/mcp/server-card.json>; rel="mcp-server-card"',
  '</.well-known/agent-card.json>; rel="agent-card"',
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
function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|facebot|twitterbot|linkedinbot|embedly|pinterest|redditbot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|bytespider|gptbot|claudebot|perplexity|whatsapp|telegrambot|discordbot|slackbot|slack|skypeuripreview|viber|mastodon/i.test(
    userAgent,
  );
}

function detectLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && isLocale(cookie)) return cookie;

  // The primary / canonical language of the site is English (defaultLocale = "en").
  // Crawlers, social share bots, and root URL visits without a saved preference always get English.
  return defaultLocale;
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

  if (pathname.startsWith("/.well-known/") || pathname === "/auth.md") {
    return NextResponse.next();
  }

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
    return NextResponse.next();
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const status = isCrawler(request.headers.get("user-agent")) ? 308 : 307;
  return NextResponse.redirect(url, status);
}

export default middleware;

export const config = {
  matcher: [
    "/((?!_next|api|\\.well-known|auth\\.md|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
