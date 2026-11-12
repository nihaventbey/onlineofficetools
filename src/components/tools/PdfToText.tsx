"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadText, formatBytes, MAX_DOC_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = { labels: Dictionary["tools"]["pdfToText"] };

type PageTextData = {
  pageNumber: number;
  text: string;
  wordCount: number;
  charCount: number;
  isScannedCandidate: boolean;
};

type OcrLang = "tur" | "eng" | "deu" | "fra" | "spa" | "ita" | "rus";

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Intelligent layout-aware text assembly from PDF.js TextContent.
 * Preserves line breaks and paragraph spacing based on Y-axis transform coordinates.
 */
function extractTextFromItems(items: unknown[]): string {
  if (!items || items.length === 0) return "";

  type TextItem = {
    str: string;
    transform: number[]; // [scaleX, skewX, skewY, scaleY, x, y]
    width?: number;
    height?: number;
  };

  const validItems: TextItem[] = [];
  for (const it of items) {
    if (it && typeof it === "object" && "str" in it && "transform" in it) {
      const item = it as TextItem;
      if (Array.isArray(item.transform) && item.transform.length >= 6) {
        validItems.push(item);
      }
    }
  }

  if (validItems.length === 0) return "";

  let result = "";
  let lastY: number | null = null;
  let lastHeight: number = 12;

  for (let i = 0; i < validItems.length; i++) {
    const item = validItems[i];
    const str = item.str;
    const currentY = item.transform[5];
    const fontHeight = Math.abs(item.transform[3]) || 12;

    if (lastY === null) {
      result += str;
    } else {
      const yDiff = Math.abs(currentY - lastY);

      if (yDiff > fontHeight * 1.5) {
        // Significant vertical leap -> Paragraph break
        result += "\n\n" + str;
      } else if (yDiff > fontHeight * 0.4) {
        // Line break
        result += "\n" + str;
      } else {
        // Same line -> add space if needed
        if (str && !str.startsWith(" ") && !result.endsWith(" ") && !result.endsWith("\n")) {
          result += " ";
        }
        result += str;
      }
    }

    lastY = currentY;
    lastHeight = fontHeight;
  }

  return result.trim();
}

export default function PdfToText({ labels }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [pagesData, setPagesData] = useState<PageTextData[]>([]);
  const [selectedPage, setSelectedPage] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [ocrLang, setOcrLang] = useState<OcrLang>("tur");
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);

  const searchInputId = useId();
  const pdfDocRef = useRef<unknown>(null);

  async function handleFile(pdfFile: File) {
    if (!isPdfFile(pdfFile)) {
      setError(labels.invalidFile);
      return;
    }
    if (pdfFile.size > MAX_DOC_BYTES) {
      setError(labels.tooLarge);
      return;
    }

    setBusy(true);
    setBusyMessage(labels.processing || "Extracting text from PDF…");
    setError("");
    setPagesData([]);
    setSelectedPage("all");
    setSearchQuery("");
    setOcrProgress(null);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;

      const extractedPages: PageTextData[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setBusyMessage(`${labels.pages || "Page"} ${i} / ${pdf.numPages}…`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = extractTextFromItems(textContent.items);

        const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
        const chars = text ? text.length : 0;
        // If text is suspiciously short (< 15 characters), page might be scanned/image-only
        const isScannedCandidate = text.trim().length < 15;

        extractedPages.push({
          pageNumber: i,
          text,
          wordCount: words,
          charCount: chars,
          isScannedCandidate,
        });
      }

      setPagesData(extractedPages);
      setFile(pdfFile);
    } catch (err) {
      console.error("PDF to text extraction failed:", err);
      setError(labels.error || "Failed to extract text from PDF.");
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  // OCR execution for scanned pages
  async function runOcrOnPages(targetPageNumber?: number) {
    if (!pdfDocRef.current || !file) return;

    setBusy(true);
    setError("");
    try {
      const Tesseract = await import("tesseract.js");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdf = pdfDocRef.current as any;

      const pagesToProcess = targetPageNumber
        ? [targetPageNumber]
        : pagesData.map((p) => p.pageNumber);

      const updatedPages = [...pagesData];

      for (let idx = 0; idx < pagesToProcess.length; idx++) {
        const pageNum = pagesToProcess[idx];
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (page.render({ canvasContext: ctx, viewport }) as any).promise;
          const imgDataUrl = canvas.toDataURL("image/png");

          setBusyMessage(
            labels.ocrProcessing
              ? labels.ocrProcessing
                  .replace("{page}", String(pageNum))
                  .replace("{total}", String(pagesToProcess.length))
              : `OCR Scanning: Page ${pageNum} / ${pagesToProcess.length}…`,
          );

          const result = await Tesseract.recognize(imgDataUrl, ocrLang, {
            logger: (m) => {
              if (m.status === "recognizing text" && typeof m.progress === "number") {
                setOcrProgress(Math.round(m.progress * 100));
              }
            },
          });

          const ocrText = (result.data.text || "").trim();
          const targetIndex = updatedPages.findIndex((p) => p.pageNumber === pageNum);

          if (targetIndex !== -1) {
            const currentText = updatedPages[targetIndex].text;
            const newText = currentText ? `${currentText}\n\n[OCR]:\n${ocrText}` : ocrText;
            updatedPages[targetIndex] = {
              ...updatedPages[targetIndex],
              text: newText,
              wordCount: newText.split(/\s+/).filter(Boolean).length,
              charCount: newText.length,
              isScannedCandidate: false,
            };
          }
        }
      }

      setPagesData([...updatedPages]);
    } catch (err) {
      console.error("OCR recognition error:", err);
      setError(labels.error || "OCR recognition failed.");
    } finally {
      setBusy(false);
      setBusyMessage("");
      setOcrProgress(null);
    }
  }

  // Filtered text based on search and selected page
  const visibleText = useMemo(() => {
    if (pagesData.length === 0) return "";

    const activeList =
      selectedPage === "all"
        ? pagesData
        : pagesData.filter((p) => p.pageNumber === selectedPage);

    const parts: string[] = [];
    for (const p of activeList) {
      if (!p.text) continue;
      if (searchQuery.trim()) {
        const lines = p.text.split("\n");
        const matchingLines = lines.filter((l) =>
          l.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        if (matchingLines.length > 0) {
          parts.push(`--- ${labels.pages || "Page"} ${p.pageNumber} ---\n` + matchingLines.join("\n"));
        }
      } else {
        parts.push(`--- ${labels.pages || "Page"} ${p.pageNumber} ---\n` + p.text);
      }
    }

    return parts.join("\n\n").trim();
  }, [pagesData, selectedPage, searchQuery, labels.pages]);

  // Total stats
  const totalStats = useMemo(() => {
    let words = 0;
    let chars = 0;
    let scannedCandidates = 0;
    for (const p of pagesData) {
      words += p.wordCount;
      chars += p.charCount;
      if (p.isScannedCandidate) scannedCandidates++;
    }
    return {
      pages: pagesData.length,
      words,
      chars,
      scannedCandidates,
    };
  }, [pagesData]);

  // Export handlers
  function handleDownloadTxt() {
    if (!visibleText && !pagesData.length) return;
    const baseName = file ? file.name.replace(/\.[^/.]+$/, "") : "extracted";
    const fullText =
      selectedPage === "all"
        ? pagesData.map((p) => `=== ${labels.pages || "Page"} ${p.pageNumber} ===\n\n${p.text}`).join("\n\n")
        : visibleText;
    downloadText(fullText, `${baseName}-text.txt`);
  }

  function handleDownloadMarkdown() {
    if (!pagesData.length) return;
    const baseName = file ? file.name.replace(/\.[^/.]+$/, "") : "extracted";
    const mdParts = pagesData.map(
      (p) => `## ${labels.pages || "Page"} ${p.pageNumber}\n\n${p.text || "*(Empty)*"}\n`,
    );
    downloadText(mdParts.join("\n---\n\n"), `${baseName}-document.md`);
  }

  async function handleCopy() {
    if (!visibleText) return;
    try {
      await navigator.clipboard.writeText(visibleText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleClear() {
    setFile(null);
    setPagesData([]);
    setSelectedPage("all");
    setSearchQuery("");
    setError("");
    setOcrProgress(null);
    pdfDocRef.current = null;
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {/* Upload Zone */}
      {!file ? (
        <div className="space-y-3">
          <FileDropZone
            accept="application/pdf,.pdf"
            dropHint={labels.dropHint}
            selectHint={labels.selectHint ?? "PDF format (Max 50 MB)"}
            onFiles={(files) => {
              if (files[0]) void handleFile(files[0]);
            }}
            disabled={busy}
          />
          <p className="text-center text-xs text-slate-400">
            {labels.limitHint}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* File Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-xl text-rose-600 shadow-2xs">
                📄
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-slate-800">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {formatBytes(file.size)} · {totalStats.pages} {labels.pages || "Pages"} · {totalStats.words.toLocaleString()} {labels.words || "Words"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-rose-600"
            >
              {labels.clear}
            </button>
          </div>

          {/* Scanned PDF OCR Notice (If candidate detected) */}
          {totalStats.scannedCandidates > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <span className="text-base">💡</span>
                <span>
                  {labels.scannedNotice ||
                    "This PDF might be scanned or image-based. Use Smart OCR to recognize text optically."}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={ocrLang}
                  onChange={(e) => setOcrLang(e.target.value as OcrLang)}
                  className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="tur">Türkçe (TR)</option>
                  <option value="eng">English (EN)</option>
                  <option value="deu">Deutsch (DE)</option>
                  <option value="fra">Français (FR)</option>
                  <option value="spa">Español (ES)</option>
                  <option value="ita">Italiano (IT)</option>
                  <option value="rus">Русский (RU)</option>
                </select>
                <button
                  type="button"
                  onClick={() => void runOcrOnPages()}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-amber-700 disabled:opacity-50"
                >
                  🔍 {labels.ocrScan || "Scan with OCR"}
                </button>
              </div>
            </div>
          ) : null}

          {/* Processing / Progress State */}
          {busy ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-center">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                {busyMessage}
              </div>
              {ocrProgress !== null ? (
                <div className="mt-2.5 mx-auto max-w-xs">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                  <span className="mt-1 block text-[11px] font-medium text-blue-600">
                    %{ocrProgress}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          ) : null}

          {/* Navigation & Search Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
            {/* Page Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedPage("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  selectedPage === "all"
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {labels.allPages || "All Pages"} ({totalStats.pages})
              </button>
              {pagesData.map((p) => (
                <button
                  key={p.pageNumber}
                  type="button"
                  onClick={() => setSelectedPage(p.pageNumber)}
                  className={`rounded-lg px-2 py-1 text-xs font-medium transition ${
                    selectedPage === p.pageNumber
                      ? "bg-white font-semibold text-blue-600 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {p.pageNumber}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative min-w-[200px]">
              <label htmlFor={searchInputId} className="sr-only">
                {labels.searchPlaceholder || "Search text…"}
              </label>
              <input
                id={searchInputId}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={labels.searchPlaceholder || "Search text…"}
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute left-2.5 top-2 text-[10px] text-slate-400">
                🔍
              </span>
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </div>

          {/* Extracted Text Area */}
          <div className="relative">
            <textarea
              value={visibleText || (searchQuery ? labels.noMatches || "No matches found" : labels.empty)}
              readOnly
              rows={16}
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs leading-relaxed text-slate-800 outline-none focus:border-blue-400"
            />
            {/* Bottom-right word/char pill */}
            <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-white/85 px-2 py-0.5 text-[10px] font-medium text-slate-500 shadow-2xs backdrop-blur-xs">
              {visibleText.split(/\s+/).filter(Boolean).length} {labels.words || "words"} · {visibleText.length} {labels.chars || "chars"}
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTxt}
                disabled={!pagesData.length}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-40"
              >
                📥 {labels.downloadTxt || "Download TXT"}
              </button>

              <button
                type="button"
                onClick={handleDownloadMarkdown}
                disabled={!pagesData.length}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40"
              >
                📘 {labels.downloadMd || "Download Markdown"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!visibleText}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40"
              >
                {copied ? "✓ " + labels.copied : "📋 " + labels.copy}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
