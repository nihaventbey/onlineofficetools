"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  labels: Dictionary["tools"]["xVideoDownloader"];
};

type XResult = {
  id: string;
  text: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
  };
  videoUrl: string;
  thumbnailUrl?: string | null;
  duration?: number;
  format: "MP4" | "GIF";
};

export default function XVideoDownloader({ labels }: Props) {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<XResult | null>(null);

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
      const res = await fetch("/api/tools/x-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to download X video. Please verify the link.");
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
            {labels.downloaderTitle || "X (Twitter) Video & GIF Downloader"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {labels.downloaderDesc ||
              "Download videos and animations from X (formerly Twitter) directly to MP4 in high definition."}
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative flex items-center">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={labels.urlPlaceholder || "Paste tweet link (e.g. https://x.com/user/status/...)"}
              className="w-full rounded-xl border border-slate-300 py-3 pl-4 pr-24 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
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
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {labels.fetchingTweet || "Fetching Video..."}
              </>
            ) : (
              labels.downloadBtn || "Download X Video"
            )}
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Video Result Card */}
        {result && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Video Player */}
              <div className="w-full sm:w-60 aspect-video rounded-xl overflow-hidden bg-black shrink-0 shadow-sm flex items-center justify-center">
                <video
                  src={result.videoUrl}
                  poster={result.thumbnailUrl || undefined}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Tweet Info & Download */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2.5">
                  {result.author.avatar && (
                    <img
                      src={result.author.avatar}
                      alt={result.author.name}
                      className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {result.author.name}
                    </h3>
                    <p className="text-xs text-slate-500">@{result.author.username}</p>
                  </div>
                </div>

                {result.text && (
                  <p className="text-xs text-slate-700 line-clamp-3">
                    {result.text}
                  </p>
                )}

                <div className="pt-2">
                  <a
                    href={result.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={`x-video-${result.id}.mp4`}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                  >
                    ⬇ {labels.downloadVideo || "Download Video (MP4)"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
