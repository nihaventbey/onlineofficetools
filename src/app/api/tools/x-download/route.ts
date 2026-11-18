import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

    if (!rawUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!/(twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/i.test(rawUrl)) {
      return NextResponse.json(
        { error: "Invalid X (Twitter) URL. Please provide a valid tweet link." },
        { status: 400 }
      );
    }

    const match = rawUrl.match(/(twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/i);
    const tweetId = match ? match[2] : "";

    // Query fxtwitter / vxtwitter public metadata API
    const response = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Tweet. Ensure the account and tweet are public." },
        { status: 404 }
      );
    }

    const data = await response.json();
    const tweet = data?.tweet;

    if (!tweet) {
      return NextResponse.json({ error: "Tweet data not found." }, { status: 404 });
    }

    // Check media
    const mediaList = tweet.media?.videos || tweet.media?.all || [];
    const video = mediaList.find(
      (m: { type: string; url?: string }) => m.type === "video" || m.type === "gif"
    );

    if (!video || !video.url) {
      return NextResponse.json(
        { error: "This tweet does not contain any video or GIF." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      id: tweet.id,
      text: tweet.text || "",
      author: {
        name: tweet.author?.name || "X User",
        username: tweet.author?.screen_name || "",
        avatar: tweet.author?.avatar_url || "",
      },
      videoUrl: video.url,
      thumbnailUrl: video.thumbnail_url || tweet.media?.photos?.[0]?.url || null,
      duration: video.duration || 0,
      format: video.type === "gif" ? "GIF" : "MP4",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
