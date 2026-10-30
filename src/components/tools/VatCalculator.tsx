"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  labels: Dictionary["tools"]["vatCalculator"];
};

export default function VatCalculator({ labels }: Props) {
  const [amount, setAmount] = useState<string>("1000");
  const [direction, setDirection] = useState<"exclusive" | "inclusive">("exclusive");
  const [vatRate, setVatRate] = useState<number>(20);
  const [customRate, setCustomRate] = useState<string>("");
  const [tevkifatRate, setTevkifatRate] = useState<number>(0); // 0 means no withholding
  const [copied, setCopied] = useState<boolean>(false);

  const effectiveRate = customRate !== "" ? parseFloat(customRate) || 0 : vatRate;

  const results = useMemo(() => {
    const rawVal = parseFloat(amount.replace(",", ".")) || 0;
    if (rawVal <= 0 || effectiveRate < 0) {
      return {
        baseAmount: 0,
        vatAmount: 0,
        withholdingAmount: 0,
        collectedVat: 0,
        totalAmount: 0,
        payableAmount: 0,
      };
    }

    let base = 0;
    let vat = 0;

    if (direction === "exclusive") {
      base = rawVal;
      vat = base * (effectiveRate / 100);
    } else {
      base = rawVal / (1 + effectiveRate / 100);
      vat = rawVal - base;
    }

    const withholding = tevkifatRate > 0 ? (vat * tevkifatRate) / 10 : 0;
    const collected = vat - withholding;
    const total = base + vat;
    const payable = base + collected;

    return {
      baseAmount: base,
      vatAmount: vat,
      withholdingAmount: withholding,
      collectedVat: collected,
      totalAmount: total,
      payableAmount: payable,
    };
  }, [amount, direction, effectiveRate, tevkifatRate]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  function copySummary() {
    const lines = [
      `Matrah (KDV Hariç): ₺${fmt(results.baseAmount)}`,
      `KDV Oranı: %${effectiveRate}`,
      `Hesaplanan KDV: ₺${fmt(results.vatAmount)}`,
    ];
    if (tevkifatRate > 0) {
      lines.push(
        `Tevkifat (${tevkifatRate}/10): ₺${fmt(results.withholdingAmount)}`,
        `Tahsil Edilecek KDV: ₺${fmt(results.collectedVat)}`,
        `Tahsil Edilecek Toplam: ₺${fmt(results.payableAmount)}`,
      );
    } else {
      lines.push(`Genel Toplam (KDV Dahil): ₺${fmt(results.totalAmount)}`);
    }

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Side: Input & Controls */}
        <div className="space-y-5">
          {/* Direction Switcher (Exclusive vs Inclusive) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Hesaplama Türü
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDirection("exclusive")}
                className={`min-h-[42px] rounded-xl transition active:scale-95 ${
                  direction === "exclusive"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                KDV Hariçten → Dahile
              </button>
              <button
                type="button"
                onClick={() => setDirection("inclusive")}
                className={`min-h-[42px] rounded-xl transition active:scale-95 ${
                  direction === "inclusive"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                KDV Dahilden → Harice
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {direction === "exclusive" ? "Matrah (KDV Hariç Tutar)" : "KDV Dahil Tutar"}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 font-bold text-slate-400">₺</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full min-h-[48px] rounded-2xl border border-slate-200 bg-white pl-9 pr-4 text-lg font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              />
            </div>
          </div>

          {/* VAT Rate Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              KDV Oranı
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 10, 20].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => {
                    setVatRate(rate);
                    setCustomRate("");
                  }}
                  className={`min-h-[42px] rounded-xl border text-sm font-bold transition active:scale-95 ${
                    customRate === "" && vatRate === rate
                      ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  %{rate}
                </button>
              ))}
              <div className="relative">
                <input
                  type="number"
                  placeholder="Özel %"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className={`w-full min-h-[42px] rounded-xl border px-2 text-center text-xs font-bold outline-none focus:border-blue-500 ${
                    customRate !== ""
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Withholding (Tevkifat) Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                KDV Tevkifatı (Opsiyonel)
              </label>
              <span className="text-[11px] text-slate-400">Fatura tevkifatı</span>
            </div>
            <select
              value={tevkifatRate}
              onChange={(e) => setTevkifatRate(Number(e.target.value))}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value={0}>Tevkifat Yok (0/10)</option>
              <option value={2}>2/10 Tevkifat</option>
              <option value={3}>3/10 Tevkifat</option>
              <option value={4}>4/10 Tevkifat</option>
              <option value={5}>5/10 Tevkifat (Yarı Yarıya)</option>
              <option value={7}>7/10 Tevkifat</option>
              <option value={9}>9/10 Tevkifat</option>
            </select>
          </div>
        </div>

        {/* Right Side: Calculation Results Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-sky-50/30 to-white p-5 shadow-xs">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900 border-b border-blue-100/80 pb-2">
              Hesaplama Özeti
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Matrah (KDV Hariç):</span>
                <span className="font-semibold text-slate-900">₺{fmt(results.baseAmount)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Hesaplanan KDV (%{effectiveRate}):</span>
                <span className="font-semibold text-blue-600">+₺{fmt(results.vatAmount)}</span>
              </div>

              {tevkifatRate > 0 && (
                <>
                  <div className="flex items-center justify-between text-amber-700">
                    <span>Tevkif Edilen KDV ({tevkifatRate}/10):</span>
                    <span className="font-semibold">-₺{fmt(results.withholdingAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>Tahsil Edilecek KDV:</span>
                    <span className="font-semibold">₺{fmt(results.collectedVat)}</span>
                  </div>
                </>
              )}

              <div className="border-t border-slate-200/80 pt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {tevkifatRate > 0 ? "Tahsil Edilecek Tutar:" : "Genel Toplam (KDV Dahil):"}
                  </div>
                  {tevkifatRate > 0 && (
                    <div className="text-[11px] text-slate-500">
                      Fatura Toplamı: ₺{fmt(results.totalAmount)}
                    </div>
                  )}
                </div>
                <div className="text-2xl font-extrabold text-blue-700">
                  ₺{fmt(tevkifatRate > 0 ? results.payableAmount : results.totalAmount)}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={copySummary}
              className="w-full inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-500 active:scale-95"
            >
              {copied ? "✓ Sonuçlar Kopyalandı!" : "📋 Sonuçları Panoya Kopyala"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
