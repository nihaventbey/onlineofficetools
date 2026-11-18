"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob } from "@/lib/files/utils";

type Props = {
  labels: Dictionary["tools"]["youtubeThumbnailDownloader"];
};

type ThumbnailOption = {
  key: "maxres" | "sd" | "hq" | "mq";
  label: string;
  resLabel: string;
  url: string;
  width: number;
  height: number;
};

function extractYouTubeId(urlOrId: string): string | null {
  const clean = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }
  const match =
    clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

export default function YoutubeThumbnailDownloader({ labels }: Props) {
  const [inputUrl, setInputUrl] = useState<string>("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInputUrl(text.trim());
    } catch {
      /* ignore */
    }
  }

  function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const id = extractYouTubeId(inputUrl);
    if (!id) {
      setError(labels.invalidUrl || "Invalid YouTube link. Please paste a valid YouTube video or Shorts URL.");
      setVideoId(null);
      return;
    }
    setVideoId(id);
  }

  const thumbnails: ThumbnailOption[] = videoId
    ? [
        {
          key: "maxres",
          label: labels.ultraHd || "Ultra HD (1080p)",
          resLabel: "1920 × 1080",
          url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          width: 1920,
          height: 1080,
        },
        {
          key: "sd",
          label: labels.standardDef || "Standard (SD)",
          resLabel: "640 × 480",
          url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
          width: 640,
          height: 480,
        },
        {
          key: "hq",
          label: labels.highQuality || "High Quality (HQ)",
          resLabel: "480 × 360",
          url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          width: 480,
          height: 360,
        },
        {
          key: "mq",
          label: labels.mediumQuality || "Medium (MQ)",
          resLabel: "320 × 180",
          url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          width: 320,
          height: 180,
        },
      ]
    : [];

  async function downloadThumbnail(thumb: ThumbnailOption) {
    try {
      const res = await fetch(thumb.url);
      const blob = await res.blob();
      downloadBlob(blob, `youtube-thumbnail-${videoId}-${thumb.key}.jpg`);
    } catch {
      // Fallback: direct link open if CORS prevents fetch
      window.open(thumb.url, "_blank");
    }
  }

  function copyUrl(thumb: ThumbnailOption) {
    void navigator.clipboard.writeText(thumb.url);
    setCopiedKey(thumb.key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {labels.downloaderTitle || "YouTube 4K & HD Thumbnail Downloader"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {labels.downloaderDesc ||
              "Extract and download YouTube cover images in Ultra HD (1080p/4K), HD, and SD quality. 100% free and instant."}
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleExtract} className="space-y-3">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder={labels.urlPlaceholder || "Paste YouTube video or shorts link (e.g. https://www.youtube.com/watch?v=...)"}
              className="w-full rounded-xl border border-slate-300 py-3 pl-4 pr-24 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              required
            />
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              📋 {labels.pasteBtn || "Paste"}
            </button>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
          >
            🔍 {labels.getThumbnails || "Get Thumbnail Images"}
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Thumbnails Grid */}
        {videoId && thumbnails.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-sm font-semibold text-slate-800">
                {labels.availableQualities || "Available Qualities"} (ID: {videoId})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {thumbnails.map((thumb) => (
                <div
                  key={thumb.key}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:shadow-md flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full bg-slate-200 overflow-hidden">
                    <img
                      src={thumb.url}
                      alt={`${thumb.label} preview`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute top-2 left-2 rounded-lg bg-black/75 px-2 py-0.5 text-[11px] font-bold text-white shadow">
                      {thumb.resLabel}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {thumb.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyUrl(thumb)}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition"
                      >
                        {copiedKey === thumb.key ? "✓ Copied Link" : "Copy Link"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => downloadThumbnail(thumb)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
                    >
                      ⬇ {labels.downloadImage || "Download Image"} ({thumb.resLabel})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
