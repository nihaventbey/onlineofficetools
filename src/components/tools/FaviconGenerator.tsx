"use client";

import { useEffect, useRef, useState } from "react";
import { createIcoFromPngs } from "@/lib/files/ico";
import type { Dictionary } from "@/lib/i18n";

type GeneratedIcon = {
  name: string;
  size: number;
  dataUrl: string;
  bytes: Uint8Array;
};

type Props = {
  labels: Dictionary["tools"]["faviconGenerator"];
};

export default function FaviconGenerator({ labels }: Props) {
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [bgColor, setBgColor] = useState<string>("transparent");
  const [shape, setShape] = useState<"square" | "rounded" | "circle">("square");
  const [padding, setPadding] = useState<number>(0); // Percentage padding
  const [icons, setIcons] = useState<GeneratedIcon[]>([]);
  const [busy, setBusy] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File drop / select handler
  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSourceImg(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Generate icons whenever source, shape, padding or bgColor changes
  useEffect(() => {
    if (!sourceImg) {
      setIcons([]);
      return;
    }

    const SIZES = [16, 32, 48, 180, 192, 512];
    const generated: GeneratedIcon[] = [];

    for (const size of SIZES) {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Apply shape clipping
      if (shape === "circle") {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      } else if (shape === "rounded") {
        const radius = size * 0.2;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(size - radius, 0);
        ctx.quadraticCurveTo(size, 0, size, radius);
        ctx.lineTo(size, size - radius);
        ctx.quadraticCurveTo(size, size, size - radius, size);
        ctx.lineTo(radius, size);
        ctx.quadraticCurveTo(0, size, 0, size - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.clip();
      }

      // Fill background
      if (bgColor !== "transparent") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
      }

      // Draw image with padding
      const pad = (size * padding) / 100;
      const drawSize = size - pad * 2;
      ctx.drawImage(sourceImg, pad, pad, drawSize, drawSize);

      const dataUrl = canvas.toDataURL("image/png");
      const base64Data = dataUrl.split(",")[1]!;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      let name = `favicon-${size}x${size}.png`;
      if (size === 180) name = "apple-touch-icon.png";
      else if (size === 192) name = "android-chrome-192x192.png";
      else if (size === 512) name = "android-chrome-512x512.png";

      generated.push({ name, size, dataUrl, bytes });
    }

    setIcons(generated);
  }, [sourceImg, bgColor, shape, padding]);

  // Download all as ZIP
  async function downloadZip() {
    if (icons.length === 0) return;
    setBusy(true);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Add PNGs
      for (const icon of icons) {
        zip.file(icon.name, icon.bytes);
      }

      // Build & Add .ico (contains 16, 32, 48)
      const icoPngs = icons
        .filter((i) => [16, 32, 48].includes(i.size))
        .map((i) => ({ width: i.size, height: i.size, bytes: i.bytes }));
      const icoBytes = createIcoFromPngs(icoPngs);
      zip.file("favicon.ico", icoBytes);

      // Add site.webmanifest
      const manifest = {
        name: fileName || "My Web App",
        short_name: fileName || "App",
        icons: [
          { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        ],
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
      };
      zip.file("site.webmanifest", JSON.stringify(manifest, null, 2));

      // Generate zip and download
      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = "favicon_io.zip";
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  function downloadSingle(icon: GeneratedIcon) {
    const a = document.createElement("a");
    a.href = icon.dataUrl;
    a.download = icon.name;
    a.click();
  }

  const htmlCode = `<!-- Favicon & Web İkonları -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
<link rel="shortcut icon" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />`;

  function copyHtml() {
    navigator.clipboard.writeText(htmlCode);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {!sourceImg ? (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/20"
        >
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />
          <span className="text-4xl mb-2">🎨</span>
          <span className="text-sm font-bold text-slate-800">
            Logonuzu veya görselinizi buraya sürükleyin
          </span>
          <span className="text-xs text-slate-500 mt-1">
            PNG, JPG, SVG veya WebP (Kare görsel önerilir)
          </span>
          <span className="mt-4 inline-flex min-h-[38px] items-center rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-md shadow-blue-500/20">
            Görsel Seç
          </span>
        </label>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3">
            {/* Shape selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Şekil</label>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShape("square")}
                  className={`rounded-lg py-1.5 transition ${shape === "square" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600"}`}
                >
                  Kare
                </button>
                <button
                  type="button"
                  onClick={() => setShape("rounded")}
                  className={`rounded-lg py-1.5 transition ${shape === "rounded" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600"}`}
                >
                  Yuvarlak
                </button>
                <button
                  type="button"
                  onClick={() => setShape("circle")}
                  className={`rounded-lg py-1.5 transition ${shape === "circle" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600"}`}
                >
                  Daire
                </button>
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Arka Plan Rengi</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBgColor("transparent")}
                  className={`min-h-[36px] flex-1 rounded-xl border text-xs font-semibold transition ${bgColor === "transparent" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"}`}
                >
                  Şeffaf
                </button>
                <button
                  type="button"
                  onClick={() => setBgColor("#ffffff")}
                  className={`min-h-[36px] flex-1 rounded-xl border text-xs font-semibold transition ${bgColor === "#ffffff" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"}`}
                >
                  Beyaz
                </button>
                <input
                  type="color"
                  value={bgColor === "transparent" ? "#ffffff" : bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded-xl border border-slate-200 p-0.5"
                  title="Özel Renk"
                />
              </div>
            </div>

            {/* Margin / Padding Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>İç Boşluk (Marjin)</span>
                <span>%{padding}</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="w-full accent-blue-600 pt-2"
              />
            </div>
          </div>

          {/* Generated Icons Grid */}
          <div>
            <div className="flex items-center justify-between pb-3">
              <h4 className="text-sm font-bold text-slate-800">
                Oluşturulan İkonlar ({icons.length + 1} Dosya)
              </h4>
              <button
                type="button"
                onClick={() => setSourceImg(null)}
                className="text-xs text-rose-600 hover:underline"
              >
                Görseli Değiştir
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {icons.map((icon) => (
                <div
                  key={icon.name}
                  className="flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-center transition hover:border-blue-300"
                >
                  <span className="text-[11px] font-bold text-slate-500">
                    {icon.size}x{icon.size}
                  </span>
                  <div className="my-2 flex h-16 w-16 items-center justify-center rounded-xl bg-white p-1 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={icon.dataUrl}
                      alt={icon.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadSingle(icon)}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    İndir
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Download All as ZIP */}
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-bold text-blue-950">
                Tam Web Paketi (ZIP)
              </h4>
              <p className="text-xs text-blue-700/80">
                Tüm PNG boyutları, çok katmanlı <code>favicon.ico</code> ve <code>site.webmanifest</code> içerir.
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={downloadZip}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-500 active:scale-95 disabled:opacity-50"
            >
              {busy ? "Paketleniyor..." : "📦 Tüm Paketi İndir (.ZIP)"}
            </button>
          </div>

          {/* HTML Code Integration Snippet */}
          <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-mono font-semibold text-slate-300">
                HTML &lt;head&gt; Kodları
              </span>
              <button
                type="button"
                onClick={copyHtml}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                {copiedHtml ? "✓ Kopyalandı!" : "Kodu Kopyala"}
              </button>
            </div>
            <pre className="overflow-x-auto text-[11px] text-slate-300 font-mono leading-relaxed">
              {htmlCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
