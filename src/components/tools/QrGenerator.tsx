"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["qrGenerator"] };

export default function QrGenerator({ labels }: Props) {
  const [text, setText, clear] = useToolDraft("qr-generator", "");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!text.trim()) {
        setDataUrl("");
        return;
      }
      try {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(text, {
          width: 280,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        if (!cancelled) {
          setDataUrl(url);
          setError("");
        }
      } catch {
        if (!cancelled) setError(labels.error);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [text, labels.error]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qr-code.png";
    a.click();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={labels.placeholder}
        rows={4}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {dataUrl ? (
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt={labels.alt} className="rounded-xl border border-slate-200" width={280} height={280} />
        </div>
      ) : (
        <p className="text-center text-sm text-slate-500">{labels.empty}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={download}
          disabled={!dataUrl}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {labels.download}
        </button>
        <button type="button" onClick={clear} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
