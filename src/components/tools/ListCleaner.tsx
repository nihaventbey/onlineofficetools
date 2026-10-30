"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  labels: Dictionary["tools"]["listCleaner"];
};

export default function ListCleaner({ labels }: Props) {
  const [input, setInput] = useState<string>("");
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(true);
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<"none" | "az" | "za" | "length" | "reverse">("none");
  const [prefixMode, setPrefixMode] = useState<"none" | "numbers" | "bullets" | "dashes">("none");
  const [joinDelimiter, setJoinDelimiter] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const stats = useMemo(() => {
    const rawLines = input.split(/\r?\n/);
    const totalCount = rawLines.length;

    let processed = rawLines.map((line) => (trimWhitespace ? line.trim() : line));
    if (removeEmpty) {
      processed = processed.filter((line) => line.length > 0);
    }

    let duplicatesRemoved = 0;
    if (removeDuplicates) {
      const seen = new Set<string>();
      const uniqueList: string[] = [];
      for (const line of processed) {
        const key = caseSensitive ? line : line.toLowerCase();
        if (seen.has(key)) {
          duplicatesRemoved++;
        } else {
          seen.add(key);
          uniqueList.push(line);
        }
      }
      processed = uniqueList;
    }

    if (sortOrder === "az") {
      processed.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: caseSensitive ? "case" : "base" }));
    } else if (sortOrder === "za") {
      processed.sort((a, b) => b.localeCompare(a, undefined, { sensitivity: caseSensitive ? "case" : "base" }));
    } else if (sortOrder === "length") {
      processed.sort((a, b) => a.length - b.length);
    } else if (sortOrder === "reverse") {
      processed.reverse();
    }

    let finalLines = processed;
    if (prefixMode === "numbers") {
      finalLines = finalLines.map((line, idx) => `${idx + 1}. ${line}`);
    } else if (prefixMode === "bullets") {
      finalLines = finalLines.map((line) => `• ${line}`);
    } else if (prefixMode === "dashes") {
      finalLines = finalLines.map((line) => `- ${line}`);
    }

    const outputText = joinDelimiter !== "" ? finalLines.join(joinDelimiter) : finalLines.join("\n");

    return {
      totalCount,
      uniqueCount: finalLines.length,
      duplicatesRemoved,
      outputText,
    };
  }, [input, removeDuplicates, caseSensitive, trimWhitespace, removeEmpty, sortOrder, prefixMode, joinDelimiter]);

  function copyResult() {
    navigator.clipboard.writeText(stats.outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadTxt() {
    const blob = new Blob([stats.outputText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "temizlenmis-liste.txt";
    a.click();
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {/* Options Panel */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl bg-slate-50 p-4 text-xs font-semibold">
        {/* Cleaning Options */}
        <div className="space-y-2">
          <span className="block font-bold text-slate-500 uppercase tracking-wider">
            Temizleme Seçenekleri
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={removeDuplicates}
              onChange={(e) => setRemoveDuplicates(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Mükerrerleri (Çiftleri) Sil
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={removeEmpty}
              onChange={(e) => setRemoveEmpty(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Boş Satırları Kaldır
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={trimWhitespace}
              onChange={(e) => setTrimWhitespace(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Kenar Boşluklarını Kırp
          </label>
        </div>

        {/* Sort Options */}
        <div className="space-y-2">
          <span className="block font-bold text-slate-500 uppercase tracking-wider">
            Sıralama Düzeni
          </span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-blue-500"
          >
            <option value="none">Sıralama Yapma (Orijinal)</option>
            <option value="az">A'dan Z'ye Sırala</option>
            <option value="za">Z'den A'ya Sırala</option>
            <option value="length">Karakter Uzunluğuna Göre</option>
            <option value="reverse">Tersine Çevir</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Büyük/Küçük Harf Duyarlı
          </label>
        </div>

        {/* Prefix / Numbers */}
        <div className="space-y-2">
          <span className="block font-bold text-slate-500 uppercase tracking-wider">
            Madde & Numaralandırma
          </span>
          <select
            value={prefixMode}
            onChange={(e) => setPrefixMode(e.target.value as typeof prefixMode)}
            className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-blue-500"
          >
            <option value="none">Ön Ek Yok</option>
            <option value="numbers">1., 2., 3. (Numaralı Liste)</option>
            <option value="bullets">• Madde İmi</option>
            <option value="dashes">- Çizgi</option>
          </select>
        </div>

        {/* Join / Single line */}
        <div className="space-y-2">
          <span className="block font-bold text-slate-500 uppercase tracking-wider">
            Tek Satırda Birleştir
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setJoinDelimiter("")}
              className={`rounded-lg px-2.5 py-1.5 border ${joinDelimiter === "" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white"}`}
            >
              Satır Satır
            </button>
            <button
              type="button"
              onClick={() => setJoinDelimiter(", ")}
              className={`rounded-lg px-2.5 py-1.5 border ${joinDelimiter === ", " ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white"}`}
            >
              Virgüllü (,)
            </button>
          </div>
        </div>
      </div>

      {/* Textareas Layout: Input vs Output */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: Input Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Giriş Listesi</span>
            <button
              type="button"
              onClick={() => setInput("")}
              className="text-slate-400 hover:text-rose-600"
            >
              Temizle
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Listenizi buraya yapıştırın (Her satıra bir öğe)..."
            rows={12}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Right: Output Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Temizlenmiş Sonuç</span>
            <span className="text-blue-600 font-bold">
              {stats.uniqueCount} Satır {stats.duplicatesRemoved > 0 ? `(${stats.duplicatesRemoved} çift silindi)` : ""}
            </span>
          </div>
          <textarea
            readOnly
            value={stats.outputText}
            placeholder="İşlenmiş listeniz burada görünecek..."
            rows={12}
            className="w-full rounded-2xl border border-blue-100 bg-blue-50/20 p-3.5 font-mono text-xs text-slate-900 outline-none"
          />
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
          <span className="rounded-lg bg-white px-2.5 py-1 border border-slate-200">
            Orijinal: {stats.totalCount} satır
          </span>
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-200">
            Net: {stats.uniqueCount} satır
          </span>
          {stats.duplicatesRemoved > 0 && (
            <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-amber-700 border border-amber-200">
              Silinen: {stats.duplicatesRemoved} çift
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyResult}
            disabled={!stats.outputText}
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-500 active:scale-95 disabled:opacity-40"
          >
            {copied ? "✓ Kopyalandı!" : "📋 Panoya Kopyala"}
          </button>
          <button
            type="button"
            onClick={downloadTxt}
            disabled={!stats.outputText}
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 disabled:opacity-40"
          >
            📥 .TXT İndir
          </button>
        </div>
      </div>
    </div>
  );
}
