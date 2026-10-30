"use client";

import { useEffect, useState } from "react";
import { FileDropZone, ProgressBar, validatePdfSize } from "@/components/tools/pdf/PdfUi";
import { downloadBlob, isPdfFile, readFileBytes } from "@/lib/pdf/utils";
import {
  buildStudioPdf,
  type PageNumberOptions,
  type StudioPageItem,
} from "@/lib/pdf/studio";

export type StudioMode = "organize" | "numbering";

type StudioLabels = {
  dropTitle?: string;
  dropHint?: string;
  selectFile?: string;
  tooLarge?: string;
  invalidFile?: string;
  error?: string;
  success?: string;
  download?: string;
  processing?: string;
  pages?: string;
  deletePage?: string;
  rotatePage?: string;
  moveLeft?: string;
  moveRight?: string;
  rotateAll?: string;
  reverseAll?: string;
  resetAll?: string;
  tabOrganize?: string;
  tabNumbering?: string;
  enableNumbering?: string;
  numberPosition?: string;
  numberFormat?: string;
  fontSize?: string;
  margin?: string;
  skipCover?: string;
  startAt?: string;
};

type Props = {
  initialMode?: StudioMode;
  labels?: StudioLabels;
};

const DEFAULT_LABELS: Required<StudioLabels> = {
  dropTitle: "PDF dosyasını buraya sürükleyin",
  dropHint: "veya bilgisayarınızdan seçin",
  selectFile: "PDF Dosyası Seç",
  tooLarge: "Dosya boyutu çok büyük (Maks. 50MB)",
  invalidFile: "Geçerli bir PDF dosyası seçin",
  error: "İşlem sırasında bir hata oluştu",
  success: "PDF başarıyla hazırlandı",
  download: "Düzenlenmiş PDF'i İndir",
  processing: "Sayfalar hazırlanıyor...",
  pages: "Sayfa",
  deletePage: "Sil",
  rotatePage: "Döndür",
  moveLeft: "Sola Taşı",
  moveRight: "Sağa Taşı",
  rotateAll: "Tümünü Döndür",
  reverseAll: "Ters Çevir",
  resetAll: "Sıfırla",
  tabOrganize: "Sayfa Sırala & Sil",
  tabNumbering: "Sayfa Numarası Ekle",
  enableNumbering: "Sayfa Numaralarını Ekle",
  numberPosition: "Konum",
  numberFormat: "Format",
  fontSize: "Yazı Boyutu",
  margin: "Kenar Boşluğu",
  skipCover: "İlk sayfayı (Kapak) atla",
  startAt: "Başlangıç Numarası",
};

export default function PdfStudioCore({
  initialMode = "organize",
  labels: userLabels = {},
}: Props) {
  const labels = { ...DEFAULT_LABELS, ...userLabels };

  const [activeTab, setActiveTab] = useState<StudioMode>(initialMode);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<StudioPageItem[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  // Page numbering settings
  const [numbering, setNumbering] = useState<PageNumberOptions>({
    enabled: initialMode === "numbering",
    position: "bottom-center",
    format: "page-x-of-y",
    fontSize: 10,
    margin: 25,
    skipFirstPage: false,
    startAt: 1,
  });

  // Load and render page thumbnails with pdfjs-dist
  async function handleFileSelect(incoming: File[]) {
    setError("");
    const selected = incoming[0];
    if (!selected || !isPdfFile(selected)) {
      setError(labels.invalidFile);
      return;
    }
    if (validatePdfSize(selected) !== "ok") {
      setError(labels.tooLarge);
      return;
    }

    setBusy(true);
    setProgress(15);
    setFile(selected);

    try {
      const bytes = await readFileBytes(selected);
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const pdf = await pdfjs.getDocument({ data: bytes }).promise;
      const totalPages = pdf.numPages;

      const pageItems: StudioPageItem[] = [];
      const thumbUrls: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        pageItems.push({
          id: `page-${i}-${Date.now()}`,
          originalIndex: i - 1,
          rotation: 0,
        });

        const page = await pdf.getPage(i);
        // Thumbnail scale (0.35 is fast, crisp and light)
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          thumbUrls.push(canvas.toDataURL("image/jpeg", 0.75));
        } else {
          thumbUrls.push("");
        }

        setProgress(15 + Math.floor((i / totalPages) * 75));
      }

      setPages(pageItems);
      setThumbnails(thumbUrls);
    } catch (err) {
      console.error(err);
      setError(labels.error);
      setFile(null);
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  // Page reordering operations
  function movePage(index: number, direction: "left" | "right") {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[index]!;
      copy[index] = copy[targetIndex]!;
      copy[targetIndex] = temp;
      return copy;
    });
  }

  function deletePage(index: number) {
    if (pages.length <= 1) {
      setError("En az 1 sayfa kalmalıdır.");
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  }

  function rotateSinglePage(index: number) {
    setPages((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p,
      ),
    );
  }

  function rotateAllPages() {
    setPages((prev) =>
      prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })),
    );
  }

  function reversePages() {
    setPages((prev) => [...prev].reverse());
  }

  function resetAll() {
    if (!file) return;
    setPages(
      thumbnails.map((_, i) => ({
        id: `page-${i + 1}-${Date.now()}`,
        originalIndex: i,
        rotation: 0,
      })),
    );
  }

  // Save and export final PDF
  async function handleDownload() {
    if (!file || pages.length === 0) return;
    setBusy(true);
    setProgress(30);
    setError("");

    try {
      const outBytes = await buildStudioPdf(file, pages, numbering);
      setProgress(100);
      const outName = file.name.replace(/\.pdf$/i, "-duzenlenmis.pdf");
      const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      downloadBlob(blob, outName);
    } catch (err) {
      console.error(err);
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {!file ? (
        <FileDropZone
          accept="application/pdf,.pdf"
          multiple={false}
          onFiles={handleFileSelect}
          dropHint={labels.dropTitle}
          selectHint={labels.dropHint}
        />
      ) : (
        <div className="space-y-6">
          {/* File Header & Mode Switcher Tabs */}
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                {file.name}
              </h3>
              <p className="text-xs text-slate-500">
                {pages.length} {labels.pages}
              </p>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100/90 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("organize")}
                className={`min-h-[38px] rounded-xl px-3.5 py-1.5 transition active:scale-95 ${
                  activeTab === "organize"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🗂️ {labels.tabOrganize}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("numbering");
                  setNumbering((prev) => ({ ...prev, enabled: true }));
                }}
                className={`min-h-[38px] rounded-xl px-3.5 py-1.5 transition active:scale-95 ${
                  activeTab === "numbering"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🔢 {labels.tabNumbering}
              </button>
            </div>
          </div>

          {/* Tab 1: Organize Controls */}
          {activeTab === "organize" && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-slate-50 p-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={rotateAllPages}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95"
                >
                  ↻ {labels.rotateAll}
                </button>
                <button
                  type="button"
                  onClick={reversePages}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95"
                >
                  ⇄ {labels.reverseAll}
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-500 shadow-2xs hover:bg-slate-50 active:scale-95"
                >
                  {labels.resetAll}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-rose-600 hover:underline"
              >
                Farklı PDF Seç
              </button>
            </div>
          )}

          {/* Tab 2: Page Numbering Controls */}
          {activeTab === "numbering" && (
            <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={numbering.enabled}
                    onChange={(e) =>
                      setNumbering((prev) => ({ ...prev, enabled: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {labels.enableNumbering}
                </label>
                <span className="text-xs text-blue-700 font-medium">
                  {numbering.enabled ? "Numaralandırma Aktif" : "Devre Dışı"}
                </span>
              </div>

              {numbering.enabled && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {labels.numberPosition}
                    </label>
                    <select
                      value={numbering.position}
                      onChange={(e) =>
                        setNumbering((prev) => ({
                          ...prev,
                          position: e.target.value as PageNumberOptions["position"],
                        }))
                      }
                      className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option value="bottom-center">Alt - Orta</option>
                      <option value="bottom-right">Alt - Sağ</option>
                      <option value="bottom-left">Alt - Sol</option>
                      <option value="top-center">Üst - Orta</option>
                      <option value="top-right">Üst - Sağ</option>
                      <option value="top-left">Üst - Sol</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {labels.numberFormat}
                    </label>
                    <select
                      value={numbering.format}
                      onChange={(e) =>
                        setNumbering((prev) => ({
                          ...prev,
                          format: e.target.value as PageNumberOptions["format"],
                        }))
                      }
                      className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option value="page-x-of-y">Sayfa X / Y</option>
                      <option value="page-x">Sayfa X</option>
                      <option value="x-of-y">X / Y</option>
                      <option value="x-only">Sadece X</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {labels.fontSize} ({numbering.fontSize}pt)
                    </label>
                    <input
                      type="range"
                      min={8}
                      max={18}
                      value={numbering.fontSize}
                      onChange={(e) =>
                        setNumbering((prev) => ({
                          ...prev,
                          fontSize: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className="flex flex-col justify-center">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-3">
                      <input
                        type="checkbox"
                        checked={numbering.skipFirstPage}
                        onChange={(e) =>
                          setNumbering((prev) => ({
                            ...prev,
                            skipFirstPage: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      {labels.skipCover}
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thumbnail Grid: Responsive 2 cols on mobile, 4-5 on desktop */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {pages.map((p, index) => {
              const thumbUrl = thumbnails[p.originalIndex];

              return (
                <div
                  key={p.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/60 p-2 text-center shadow-xs transition hover:border-blue-300 hover:shadow-md"
                >
                  {/* Top Bar on Card: Page Number Tag */}
                  <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-slate-600">
                    <span className="rounded-md bg-white px-2 py-0.5 shadow-2xs">
                      #{index + 1}
                    </span>
                    {p.rotation > 0 && (
                      <span className="text-blue-600">{p.rotation}°</span>
                    )}
                  </div>

                  {/* Thumbnail Image */}
                  <div className="relative my-1 flex min-h-[140px] items-center justify-center overflow-hidden rounded-xl bg-white p-1">
                    {thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbUrl}
                        alt={`Sayfa ${index + 1}`}
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                        className="max-h-[160px] w-auto max-w-full object-contain transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex h-32 w-24 items-center justify-center border border-dashed text-slate-300 text-xs">
                        Önizleme
                      </div>
                    )}
                  </div>

                  {/* Actions Bar on Card (Touch friendly min 36px) */}
                  <div className="mt-2 grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => movePage(index, "left")}
                      title={labels.moveLeft}
                      className="flex min-h-[36px] items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-100 disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => rotateSinglePage(index)}
                      title={labels.rotatePage}
                      className="flex min-h-[36px] items-center justify-center rounded-lg bg-white text-blue-600 shadow-2xs hover:bg-slate-100"
                    >
                      ↻
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePage(index)}
                      title={labels.deletePage}
                      className="flex min-h-[36px] items-center justify-center rounded-lg bg-white text-rose-600 shadow-2xs hover:bg-rose-50"
                    >
                      🗑
                    </button>
                    <button
                      type="button"
                      disabled={index === pages.length - 1}
                      onClick={() => movePage(index, "right")}
                      title={labels.moveRight}
                      className="flex min-h-[36px] items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-100 disabled:opacity-30"
                    >
                      →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Download & Action Bar */}
          <div className="sticky bottom-4 z-20 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Hazır: {pages.length} sayfa
                  {numbering.enabled ? " • Numaralandırma uygulanacak" : ""}
                </p>
                <p className="text-[11px] text-slate-500">
                  Dosyanız sunucuya yüklenmeden tarayıcınızda doğrudan işlenir.
                </p>
              </div>

              <button
                type="button"
                disabled={busy || pages.length === 0}
                onClick={handleDownload}
                className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-500 active:scale-95 disabled:opacity-50"
              >
                {busy ? labels.processing : labels.download}
              </button>
            </div>
          </div>
        </div>
      )}

      {busy && <ProgressBar value={progress} label={labels.processing} />}
      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}
