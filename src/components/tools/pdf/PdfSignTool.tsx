"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob, formatBytes, MAX_DOC_BYTES } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = {
  labels: Dictionary["tools"]["pdfSign"];
};

type SignatureType = "draw" | "type" | "upload" | "stamp";

type PlacedSignature = {
  id: string;
  dataUrl: string;
  pageNumber: number;
  x: number; // percentage of page width
  y: number; // percentage of page height
  width: number; // percentage
  height: number; // percentage
};

const STAMP_PRESETS = [
  { text: "APPROVED", color: "#16a34a" },
  { text: "VERIFIED", color: "#2563eb" },
  { text: "CONFIDENTIAL", color: "#dc2626" },
  { text: "PAID", color: "#059669" },
  { text: "ONAYLANDI", color: "#0284c7" },
];

export default function PdfSignTool({ labels }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }[]>([]);
  const [busy, setBusy] = useState<boolean>(false);
  const [busyMessage, setBusyMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Signature creation modal / state
  const [sigType, setSigType] = useState<SignatureType>("draw");
  const [typedName, setTypedName] = useState<string>("");
  const [typedFont, setTypedFont] = useState<string>("cursive");
  const [penColor, setPenColor] = useState<string>("#1e293b");
  const [penWidth, setPenWidth] = useState<number>(3);
  const [currentSignatureImg, setCurrentSignatureImg] = useState<string | null>(null);

  // Placed signatures on the document
  const [placedItems, setPlacedItems] = useState<PlacedSignature[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Canvas ref for drawing
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // PDF Page preview container
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Load and render PDF pages via pdfjs-dist
  async function handleFile(pdfFile: File) {
    if (pdfFile.type !== "application/pdf" && !pdfFile.name.toLowerCase().endsWith(".pdf")) {
      setError(labels.invalidFile || "Invalid PDF file.");
      return;
    }
    if (pdfFile.size > MAX_DOC_BYTES) {
      setError(labels.tooLarge || "File too large.");
      return;
    }

    setBusy(true);
    setBusyMessage(labels.loading || "Loading PDF pages…");
    setError("");
    setPlacedItems([]);
    setSelectedItemId(null);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const buffer = await pdfFile.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
      setNumPages(doc.numPages);

      const thumbs: string[] = [];
      const dims: { width: number; height: number }[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        setBusyMessage(`${labels.page || "Page"} ${i} / ${doc.numPages}…`);
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        dims.push({ width: viewport.width, height: viewport.height });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (page.render({ canvasContext: ctx, viewport }) as any).promise;
          thumbs.push(canvas.toDataURL("image/png"));
        }
      }

      setPageDimensions(dims);
      setPageThumbnails(thumbs);
      setCurrentPage(1);
      setFile(pdfFile);
    } catch (err) {
      console.error("PDF load error:", err);
      setError(labels.error || "Failed to load PDF.");
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  // Draw signature event handlers
  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  function drawMove(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (drawCanvasRef.current) {
      setCurrentSignatureImg(drawCanvasRef.current.toDataURL("image/png"));
    }
  }

  function clearDrawingCanvas() {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
      setCurrentSignatureImg(null);
    }
  }

  // Render Unicode typed text to PNG
  function generateTypedSignature(name: string, font: string, color: string) {
    if (!name.trim()) {
      setCurrentSignatureImg(null);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.font = `italic 56px ${font}, "Segoe UI", Tahoma, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);

    setCurrentSignatureImg(canvas.toDataURL("image/png"));
  }

  // Render Official Stamp
  function generateStamp(text: string, color: string) {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 140;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = color;
    ctx.font = `bold 32px monospace, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 12);

    ctx.font = `14px sans-serif`;
    ctx.fillText(new Date().toISOString().split("T")[0], canvas.width / 2, canvas.height / 2 + 25);

    setCurrentSignatureImg(canvas.toDataURL("image/png"));
  }

  // Handle uploaded image
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const imgFile = e.target.files?.[0];
    if (!imgFile || !imgFile.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setCurrentSignatureImg(event.target.result);
      }
    };
    reader.readAsDataURL(imgFile);
  }

  // Place signature onto current page
  function placeSignatureOnPage() {
    if (!currentSignatureImg) return;
    const newId = `sig-${Date.now()}`;
    const newItem: PlacedSignature = {
      id: newId,
      dataUrl: currentSignatureImg,
      pageNumber: currentPage,
      x: 35, // centered default (35% - 65%)
      y: 65, // bottom area default
      width: 30, // 30% width of page
      height: 12,
    };
    setPlacedItems((prev) => [...prev, newItem]);
    setSelectedItemId(newId);
  }

  // Remove placed item
  function removeItem(id: string) {
    setPlacedItems((prev) => prev.filter((it) => it.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  }

  // Final PDF Generation via pdf-lib
  async function handleExportSignedPdf() {
    if (!file || placedItems.length === 0) return;
    setBusy(true);
    setBusyMessage(labels.exporting || "Embedding signatures and generating PDF…");
    setError("");

    try {
      const { PDFDocument } = await import("pdf-lib");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      for (const item of placedItems) {
        if (item.pageNumber > pages.length) continue;
        const page = pages[item.pageNumber - 1];
        const { width: pWidth, height: pHeight } = page.getSize();

        // Convert dataUrl to PNG image in pdf-lib
        const pngImageBytes = await fetch(item.dataUrl).then((res) => res.arrayBuffer());
        const pngImage = await pdfDoc.embedPng(pngImageBytes);

        // Calculate absolute coordinates (PDF Y axis is bottom-to-top)
        const absWidth = (item.width / 100) * pWidth;
        const absHeight = (item.height / 100) * pHeight;
        const absX = (item.x / 100) * pWidth;
        const absY = pHeight - (item.y / 100) * pHeight - absHeight;

        page.drawImage(pngImage, {
          x: absX,
          y: absY,
          width: absWidth,
          height: absHeight,
        });
      }

      const signedBytes = await pdfDoc.save();
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      downloadBlob(new Blob([signedBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }), `${baseName}-signed.pdf`);
    } catch (err) {
      console.error("Signed PDF export failed:", err);
      setError(labels.error || "Failed to generate signed PDF.");
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {!file ? (
        <div className="space-y-3">
          <FileDropZone
            accept="application/pdf,.pdf"
            dropHint={labels.dropHint || "Drop your PDF here or click to select"}
            selectHint={labels.selectHint || "PDF format supported (Max 50 MB)"}
            onFiles={(files) => {
              if (files[0]) void handleFile(files[0]);
            }}
            disabled={busy}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600 shadow-2xs">
                ✍️
              </span>
              <div>
                <h3 className="truncate text-sm font-bold text-slate-800 max-w-sm">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {formatBytes(file.size)} · {numPages} {labels.page || "Pages"} · {placedItems.length} {labels.placedCount || "signatures placed"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPageThumbnails([]);
                  setPlacedItems([]);
                }}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {labels.changeFile || "Change PDF"}
              </button>
              <button
                type="button"
                onClick={handleExportSignedPdf}
                disabled={placedItems.length === 0 || busy}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-40"
              >
                📥 {labels.downloadSigned || "Download Signed PDF"}
              </button>
            </div>
          </div>

          {/* Busy Notice */}
          {busy ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-center text-xs font-semibold text-blue-700">
              <span className="inline-block h-3.5 w-3.5 mr-2 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              {busyMessage}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          ) : null}

          {/* Main 2-Column Work Area */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Signature Generator Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {labels.createSignature || "Create Signature / Stamp"}
              </h4>

              {/* Signature Modes */}
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-200/70 p-1 text-xs font-bold">
                {[
                  { id: "draw", label: labels.draw || "Draw", icon: "✏️" },
                  { id: "type", label: labels.type || "Type", icon: "🔤" },
                  { id: "stamp", label: labels.stamp || "Stamp", icon: "💮" },
                  { id: "upload", label: labels.upload || "Upload", icon: "🖼️" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSigType(tab.id as SignatureType);
                      setCurrentSignatureImg(null);
                    }}
                    className={`min-h-[32px] rounded-lg transition active:scale-95 ${
                      sigType === tab.id
                        ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Mode 1: Freehand Drawing */}
              {sigType === "draw" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {["#0f172a", "#1d4ed8", "#b91c1c"].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setPenColor(col)}
                          style={{ backgroundColor: col }}
                          className={`h-5 w-5 rounded-full border-2 transition ${
                            penColor === col ? "border-amber-400 scale-110" : "border-white"
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={clearDrawingCanvas}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      {labels.clearCanvas || "Clear Pad"}
                    </button>
                  </div>

                  <canvas
                    ref={drawCanvasRef}
                    width={400}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={drawMove}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={drawMove}
                    onTouchEnd={stopDrawing}
                    className="h-40 w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-white cursor-crosshair shadow-inner"
                  />
                </div>
              )}

              {/* Mode 2: Unicode Type Signature */}
              {sigType === "type" && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => {
                      setTypedName(e.target.value);
                      generateTypedSignature(e.target.value, typedFont, penColor);
                    }}
                    placeholder={labels.typeNamePlaceholder || "Type your name in any language (e.g. John Doe, राहुल, محمد)"}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />

                  <div className="flex gap-2">
                    {["cursive", "serif", "sans-serif"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setTypedFont(f);
                          generateTypedSignature(typedName, f, penColor);
                        }}
                        className={`flex-1 rounded-lg border py-1.5 text-xs font-bold capitalize transition ${
                          typedFont === f ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode 3: Official Stamps */}
              {sigType === "stamp" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {STAMP_PRESETS.map((st) => (
                      <button
                        key={st.text}
                        type="button"
                        onClick={() => generateStamp(st.text, st.color)}
                        style={{ borderColor: st.color, color: st.color }}
                        className="rounded-xl border-2 py-2 text-xs font-black tracking-wider transition hover:bg-slate-100"
                      >
                        {st.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode 4: Upload Image */}
              {sigType === "upload" && (
                <div className="space-y-2">
                  <label className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-center hover:border-blue-500">
                    <span className="text-xs font-semibold text-slate-600">
                      {labels.uploadHint || "Upload transparent PNG or JPG signature / company stamp"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Add to Page Button */}
              <button
                type="button"
                onClick={placeSignatureOnPage}
                disabled={!currentSignatureImg}
                className="w-full inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-40"
              >
                + {labels.placeOnPage || "Place on Current Page"} ({currentPage})
              </button>

              {/* Placed Signatures List */}
              {placedItems.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {labels.placedSignatures || "Signatures on Document"}
                  </h5>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {placedItems.map((it, idx) => (
                      <div
                        key={it.id}
                        className={`flex items-center justify-between rounded-lg p-2 text-xs transition border ${
                          selectedItemId === it.id ? "border-blue-500 bg-blue-50/60" : "border-slate-200 bg-white"
                        }`}
                      >
                        <div
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => {
                            setSelectedItemId(it.id);
                            setCurrentPage(it.pageNumber);
                          }}
                        >
                          <span className="font-bold text-slate-700">#{idx + 1}</span>
                          <span className="text-slate-500">
                            {labels.page || "Page"} {it.pageNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="text-xs text-rose-500 hover:text-rose-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: PDF Page Viewport & Signature Placement (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              {/* Page Navigator */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs font-semibold">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                >
                  ◀ {labels.prevPage || "Prev"}
                </button>
                <span>
                  {labels.page || "Page"} {currentPage} / {numPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= numPages}
                  onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                >
                  {labels.nextPage || "Next"} ▶
                </button>
              </div>

              {/* Interactive Page Sheet */}
              <div
                ref={pageContainerRef}
                className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-100 p-2 shadow-inner flex items-center justify-center select-none"
              >
                {pageThumbnails[currentPage - 1] ? (
                  <div className="relative inline-block max-w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pageThumbnails[currentPage - 1]}
                      alt={`Page ${currentPage}`}
                      className="block max-h-[580px] w-auto rounded-lg shadow-md object-contain bg-white"
                    />

                    {/* Placed signature overlays on this specific page */}
                    {placedItems
                      .filter((it) => it.pageNumber === currentPage)
                      .map((it) => {
                        const isSelected = selectedItemId === it.id;
                        return (
                          <div
                            key={it.id}
                            onClick={() => setSelectedItemId(it.id)}
                            style={{
                              left: `${it.x}%`,
                              top: `${it.y}%`,
                              width: `${it.width}%`,
                              height: `${it.height}%`,
                            }}
                            className={`absolute cursor-move flex items-center justify-center transition-shadow ${
                              isSelected
                                ? "ring-2 ring-blue-600 bg-blue-500/10 rounded-lg"
                                : "hover:ring-1 hover:ring-slate-400"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={it.dataUrl}
                              alt="Signature"
                              className="h-full w-full object-contain pointer-events-none"
                            />
                            {isSelected && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeItem(it.id);
                                }}
                                className="absolute -top-2.5 -right-2.5 h-5 w-5 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center shadow-md hover:bg-rose-700"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : null}
              </div>

              <p className="text-center text-[11px] text-slate-400">
                💡 {labels.placementHint || "Click and position your signature anywhere on the document."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
