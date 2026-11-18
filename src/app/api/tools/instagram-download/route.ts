import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

    if (!rawUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!/instagram\.com\/(reel|p|tv|stories)\/([^/?#&]+)/i.test(rawUrl)) {
      return NextResponse.json(
        { error: "Invalid Instagram URL. Please provide a valid public Reel or Post link." },
        { status: 400 }
      );
    }

    // Match shortcode
    const match = rawUrl.match(/instagram\.com\/(reel|p|tv|stories)\/([^/?#&]+)/i);
    const shortcode = match ? match[2] : "";

    // 1. Try fetching via clean Instagram web embed or page with crawler user agent
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    };

    const targetUrl = `https://www.instagram.com/p/${shortcode}/`;
    const res = await fetch(targetUrl, {
      headers,
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Could not access Instagram post. Please verify that the post is public." },
        { status: 404 }
      );
    }

    const html = await res.text();

    // Extract OpenGraph meta tags
    const ogVideoMatch = html.match(
      /<meta\s+property=["']og:video(?::secure_url)?["']\s+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:video(?::secure_url)?["']/i
    );

    const ogImageMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i
    );

    const ogTitleMatch = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i
    );

    const ogDescMatch = html.match(
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i
    );

    const decodeHtml = (str: string) =>
      str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\\u0026/g, "&");

    const videoUrl = ogVideoMatch ? decodeHtml(ogVideoMatch[1]) : null;
    const imageUrl = ogImageMatch ? decodeHtml(ogImageMatch[1]) : null;
    const title = ogTitleMatch ? decodeHtml(ogTitleMatch[1]) : "Instagram Media";
    const description = ogDescMatch ? decodeHtml(ogDescMatch[1]) : "";

    if (!videoUrl && !imageUrl) {
      return NextResponse.json(
        { error: "No media found. The account or post might be private." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      shortcode,
      title,
      description,
      mediaType: videoUrl ? "video" : "image",
      videoUrl,
      imageUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
