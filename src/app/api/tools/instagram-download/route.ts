import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type MediaItem = {
  mediaType: "video" | "image";
  videoUrl: string | null;
  imageUrl: string | null;
};

type ShortcodeMedia = {
  __typename?: string;
  is_video?: boolean;
  video_url?: string;
  display_url?: string;
  thumbnail_src?: string;
  owner?: { username?: string };
  edge_media_to_caption?: {
    edges?: Array<{ node?: { text?: string } }>;
  };
  edge_sidecar_to_children?: {
    edges?: Array<{
      node?: {
        __typename?: string;
        is_video?: boolean;
        video_url?: string;
        display_url?: string;
      };
    }>;
  };
};

const CRAWLER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function decodeHtml(str: string): string {
  return str
    .replace(/\\u0026/gi, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const cp = parseInt(hex, 16);
      return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : _;
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const cp = parseInt(dec, 10);
      return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : _;
    });
}

function unescapeEmbeddedUrl(raw: string): string {
  return decodeHtml(
    raw
      .replace(/\\+\//g, "/")
      .replace(/\\+u0026/gi, "&")
      .replace(/\\+u0025/gi, "%")
      .replace(/\\+u003d/gi, "="),
  );
}

function extractInputUrl(rawInput: string): string {
  const urlMatch = rawInput.match(/https?:\/\/[^\s"'<>]+/i);
  if (urlMatch) {
    return urlMatch[0];
  }
  const bareMatch = rawInput.match(
    /(?:www\.)?(?:instagram\.com|instagr\.am)\/[^\s"'<>]+/i,
  );
  if (bareMatch) {
    return `https://${bareMatch[0]}`;
  }
  return rawInput.trim();
}

function extractMetaContent(html: string, propertyName: string): string | null {
  const escaped = propertyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const forward = new RegExp(
    `<meta\\s+(?:[^>]*?\\s)?property=["']${escaped}["'][^>]*?content=["']([^"']+)["']`,
    "i",
  );
  const reverse = new RegExp(
    `<meta\\s+(?:[^>]*?\\s)?content=["']([^"']+)["'][^>]*?property=["']${escaped}["']`,
    "i",
  );
  const m = html.match(forward) || html.match(reverse);
  return m ? decodeHtml(m[1]) : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawInput = typeof body?.url === "string" ? body.url.trim() : "";

    if (!rawInput) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let targetUrl = extractInputUrl(rawInput);

    // Resolve mobile /share/ links via redirect or canonical metadata
    if (/(?:instagram\.com|instagr\.am)\/share\//i.test(targetUrl)) {
      try {
        const shareRes = await fetch(targetUrl, {
          method: "GET",
          headers: CRAWLER_HEADERS,
          redirect: "follow",
          signal: AbortSignal.timeout(10000),
        });
        if (shareRes.url && !/\/share\//i.test(shareRes.url)) {
          targetUrl = shareRes.url;
        } else if (shareRes.ok) {
          const shareHtml = await shareRes.text();
          const canonical =
            extractMetaContent(shareHtml, "og:url") ||
            shareHtml.match(
              /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i,
            )?.[1];
          if (canonical) {
            targetUrl = canonical;
          }
        }
      } catch {
        // Fall through to shortcode check
      }
    }

    // Stories require an authenticated Instagram session
    if (/(?:instagram\.com|instagr\.am)\/stories\//i.test(targetUrl)) {
      return NextResponse.json(
        {
          error:
            "Instagram Stories are 24-hour temporary items that require an authenticated Instagram session. Public Reels, Video posts, and Photo posts are supported.",
        },
        { status: 400 },
      );
    }

    const shortcodeMatch = targetUrl.match(
      /(?:instagram\.com|instagr\.am)\/(?:(?!reel(?:s)?\/|p\/|tv\/|stories\/|share\/)[A-Za-z0-9._]+\/)?(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/i,
    );
    const shortcode = shortcodeMatch ? shortcodeMatch[1] : "";

    if (!shortcode) {
      return NextResponse.json(
        {
          error:
            "Invalid Instagram URL. Please provide a valid public Reel, Video, or Post link.",
        },
        { status: 400 },
      );
    }

    let videoUrl: string | null = null;
    let imageUrl: string | null = null;
    let title = "Instagram Media";
    let description = "";
    let items: MediaItem[] = [];

    // Stage 1: Fetch Instagram captioned embed endpoint
    try {
      const embedRes = await fetch(
        `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
        {
          headers: CRAWLER_HEADERS,
          signal: AbortSignal.timeout(10000),
          redirect: "follow",
        },
      );

      if (embedRes.ok) {
        const embedHtml = await embedRes.text();

        // 1a: Parse embedded contextJSON payload
        const ctxMatch = embedHtml.match(
          /"contextJSON":(".*?")(?:,"|}\])/,
        );
        if (ctxMatch) {
          try {
            const jsonStr = JSON.parse(ctxMatch[1]) as string;
            const parsed = JSON.parse(jsonStr) as {
              gql_data?: {
                shortcode_media?: ShortcodeMedia;
                xdt_shortcode_media?: ShortcodeMedia;
              };
            };
            const media =
              parsed?.gql_data?.shortcode_media ||
              parsed?.gql_data?.xdt_shortcode_media;

            if (media) {
              videoUrl = media.video_url || null;
              imageUrl = media.display_url || media.thumbnail_src || null;

              const username = media.owner?.username;
              title = username ? `@${username}` : "Instagram Media";
              description =
                media.edge_media_to_caption?.edges?.[0]?.node?.text || "";

              const children = media.edge_sidecar_to_children?.edges;
              if (Array.isArray(children) && children.length > 0) {
                items = children
                  .map((edge): MediaItem | null => {
                    const node = edge?.node;
                    if (!node) return null;
                    const itemVideo = node.video_url || null;
                    const itemImage = node.display_url || null;
                    if (!itemVideo && !itemImage) return null;
                    return {
                      mediaType:
                        node.is_video && itemVideo ? "video" : "image",
                      videoUrl: itemVideo,
                      imageUrl: itemImage,
                    };
                  })
                  .filter((it): it is MediaItem => it !== null);

                if (!videoUrl) {
                  const firstVideo = items.find((it) => it.videoUrl);
                  if (firstVideo) {
                    videoUrl = firstVideo.videoUrl;
                  }
                }
              }
            }
          } catch {
            // Fall through to 1b/1c
          }
        }

        // 1b: Escaped regex fallback on embed HTML
        if (!videoUrl && !imageUrl) {
          const vMatch = embedHtml.match(
            /\\?"video_url\\?":\\?"([^"]+?)\\?"/,
          );
          const dMatch = embedHtml.match(
            /\\?"display_url\\?":\\?"([^"]+?)\\?"/,
          );
          if (vMatch?.[1]) {
            videoUrl = unescapeEmbeddedUrl(vMatch[1]);
          }
          if (dMatch?.[1]) {
            imageUrl = unescapeEmbeddedUrl(dMatch[1]);
          }
        }

        // 1c: Embedded DOM fallback for single-image posts
        if (!videoUrl && !imageUrl) {
          const imgTagMatch = embedHtml.match(
            /<img[^>]*class=["'][^"']*EmbeddedMediaImage[^"']*["'][^>]*>/i,
          );
          if (imgTagMatch) {
            const imgTag = imgTagMatch[0];
            const srcsetMatch = imgTag.match(/srcset=["']([^"']+)["']/i);
            const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);

            if (srcsetMatch?.[1]) {
              const candidates = decodeHtml(srcsetMatch[1])
                .split(",")
                .map((part) => part.trim().split(/\s+/)[0])
                .filter(Boolean);
              if (candidates.length > 0) {
                imageUrl = candidates[candidates.length - 1];
              }
            }
            if (!imageUrl && srcMatch?.[1]) {
              imageUrl = decodeHtml(srcMatch[1]);
            }
          }

          const userMatch = embedHtml.match(
            /class=["'][^"']*UsernameText[^"']*["'][^>]*>([^<]+)</i,
          );
          if (userMatch?.[1]) {
            title = `@${decodeHtml(userMatch[1].trim())}`;
          }
        }
      }
    } catch {
      // Fall through to Stage 2
    }

    // Stage 2: Fallback to main post page OpenGraph metadata
    if (!videoUrl && !imageUrl) {
      const pageRes = await fetch(`https://www.instagram.com/p/${shortcode}/`, {
        headers: CRAWLER_HEADERS,
        signal: AbortSignal.timeout(10000),
        redirect: "follow",
      });

      if (!pageRes.ok) {
        return NextResponse.json(
          {
            error:
              "Could not access Instagram post. Please verify that the post is public.",
          },
          { status: 404 },
        );
      }

      const html = await pageRes.text();
      videoUrl =
        extractMetaContent(html, "og:video:secure_url") ||
        extractMetaContent(html, "og:video");
      imageUrl = extractMetaContent(html, "og:image");
      title = extractMetaContent(html, "og:title") || title;
      description = extractMetaContent(html, "og:description") || description;
    }

    if (!videoUrl && !imageUrl) {
      return NextResponse.json(
        { error: "No media found. The account or post might be private." },
        { status: 404 },
      );
    }

    if (items.length === 0) {
      items = [
        {
          mediaType: videoUrl ? "video" : "image",
          videoUrl,
          imageUrl,
        },
      ];
    }

    return NextResponse.json({
      success: true,
      shortcode,
      title: decodeHtml(title),
      description: decodeHtml(description),
      mediaType: videoUrl ? "video" : "image",
      videoUrl,
      imageUrl,
      items,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
