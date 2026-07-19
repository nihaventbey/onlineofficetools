"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  dict: Dictionary;
  url: string;
  title: string;
  description?: string;
};

export default function ToolShareButtons({
  dict,
  url,
  title,
  description = "",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(
    description ? `${title} — ${description}` : title,
  );

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title, text: description, url });
    } catch {
      /* cancelled */
    }
  }

  const links = [
    {
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      label: dict.common.shareOnX,
    },
    {
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      label: dict.common.shareOnFacebook,
    },
    {
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      label: dict.common.shareOnLinkedIn,
    },
    {
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      label: dict.common.shareOnWhatsApp,
    },
    {
      href: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
      label: dict.common.shareViaEmail,
    },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label={dict.common.shareMenu}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {dict.common.shareLabel}
      </span>
      {canNativeShare ? (
        <button
          type="button"
          onClick={() => void nativeShare()}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-blue-300"
          title={dict.common.shareNative}
        >
          {dict.common.shareNative}
        </button>
      ) : null}
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-blue-300"
          title={link.label}
        >
          {link.label}
        </a>
      ))}
      <button
        type="button"
        onClick={() => void copyLink()}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-blue-300"
        title={dict.common.shareCopied}
      >
        {copied ? dict.common.shareCopied : dict.common.shareCopyLink}
      </button>
    </div>
  );
}
