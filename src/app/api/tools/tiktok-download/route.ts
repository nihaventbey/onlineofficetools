import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

    if (!rawUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Basic TikTok URL check
    if (!/(tiktok\.com|douyin\.com)/i.test(rawUrl)) {
      return NextResponse.json(
        { error: "Invalid TikTok URL. Please provide a valid tiktok.com video link." },
        { status: 400 }
      );
    }

    // Call TikWM public resolver API
    const response = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: new URLSearchParams({
        url: rawUrl,
        count: "12",
        cursor: "0",
        web: "1",
        hd: "1",
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to resolve TikTok video. Please try again later." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.code !== 0 || !data.data) {
      return NextResponse.json(
        { error: data.msg || "Could not extract video. Ensure the video is public." },
        { status: 404 }
      );
    }

    const videoData = data.data;

    return NextResponse.json({
      success: true,
      id: videoData.id,
      title: videoData.title || "TikTok Video",
      cover: videoData.cover || videoData.origin_cover,
      duration: videoData.duration || 0,
      videoUrl: videoData.hdplay || videoData.play,
      watermarkVideoUrl: videoData.wmplay,
      audioUrl: videoData.music || videoData.music_info?.play,
      author: {
        name: videoData.author?.nickname || "TikTok User",
        username: videoData.author?.unique_id || "",
        avatar: videoData.author?.avatar,
      },
      stats: {
        likes: videoData.digg_count || 0,
        comments: videoData.comment_count || 0,
        shares: videoData.share_count || 0,
        views: videoData.play_count || 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
