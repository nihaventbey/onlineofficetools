"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  labels: Dictionary["tools"]["instagramDownloader"];
};

type IgResult = {
  shortcode: string;
  title: string;
  description: string;
  mediaType: "video" | "image";
  videoUrl?: string | null;
  imageUrl?: string | null;
};

export default function InstagramDownloader({ labels }: Props) {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<IgResult | null>(null);

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      /* ignore */
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/tools/instagram-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to download Instagram media.");
      }

      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {labels.downloaderTitle || "Instagram Reels & Video Downloader"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {labels.downloaderDesc ||
              "Download public Instagram Reels, videos, and post photos directly in original high quality."}
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative flex items-center">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={labels.urlPlaceholder || "Paste Instagram Reel or Post link (e.g. https://www.instagram.com/reel/...)"}
              className="w-full rounded-xl border border-slate-300 py-3 pl-4 pr-24 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            disabled={loading || !url.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-pink-700 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {labels.fetchingMedia || "Fetching Media..."}
              </>
            ) : (
              labels.downloadBtn || "Download Instagram Media"
            )}
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Media Result */}
        {result && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Media Preview */}
              <div className="w-full sm:w-56 aspect-[9/16] rounded-xl overflow-hidden bg-black shrink-0 shadow-sm flex items-center justify-center">
                {result.mediaType === "video" && result.videoUrl ? (
                  <video
                    src={result.videoUrl}
                    poster={result.imageUrl || undefined}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : result.imageUrl ? (
                  <img
                    src={result.imageUrl}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>

              {/* Media Info & Download */}
              <div className="flex-1 space-y-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-semibold text-pink-700">
                  {result.mediaType === "video" ? "📹 Reel / Video" : "🖼️ Photo"}
                </span>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {result.title}
                </h3>

                {result.description && (
                  <p className="text-xs text-slate-600 line-clamp-3">
                    {result.description}
                  </p>
                )}

                <div className="pt-2">
                  {result.videoUrl ? (
                    <a
                      href={result.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={`instagram-${result.shortcode}.mp4`}
                      className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-pink-700 transition"
                    >
                      ⬇ {labels.downloadVideo || "Download Video (MP4)"}
                    </a>
                  ) : result.imageUrl ? (
                    <a
                      href={result.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={`instagram-${result.shortcode}.jpg`}
                      className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-pink-700 transition"
                    >
                      ⬇ {labels.downloadImage || "Download Image (JPG)"}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
