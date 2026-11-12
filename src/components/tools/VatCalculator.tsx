"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  labels: Dictionary["tools"]["vatCalculator"];
};

type Currency = {
  symbol: string;
  code: string;
  label: string;
};

const CURRENCIES: Currency[] = [
  { symbol: "$", code: "USD", label: "$ (USD)" },
  { symbol: "€", code: "EUR", label: "€ (EUR)" },
  { symbol: "£", code: "GBP", label: "£ (GBP)" },
  { symbol: "₺", code: "TRY", label: "₺ (TRY)" },
  { symbol: "₹", code: "INR", label: "₹ (INR)" },
  { symbol: "¥", code: "JPY", label: "¥ (JPY)" },
  { symbol: "A$", code: "AUD", label: "A$ (AUD)" },
  { symbol: "C$", code: "CAD", label: "C$ (CAD)" },
];

const GLOBAL_VAT_PRESETS = [
  { label: "%5", rate: 5 },
  { label: "%10", rate: 10 },
  { label: "%18", rate: 18 },
  { label: "%19", rate: 19 },
  { label: "%20", rate: 20 },
  { label: "%21", rate: 21 },
];

export default function VatCalculator({ labels }: Props) {
  const [amount, setAmount] = useState<string>("1000");
  const [currency, setCurrency] = useState<string>("$");
  const [direction, setDirection] = useState<"exclusive" | "inclusive">("exclusive");
  const [vatRate, setVatRate] = useState<number>(20);
  const [customRate, setCustomRate] = useState<string>("");
  const [showWithholding, setShowWithholding] = useState<boolean>(false);
  const [withholdingPercent, setWithholdingPercent] = useState<number>(0);
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

    const withholding = (showWithholding && withholdingPercent > 0) ? (vat * (withholdingPercent / 100)) : 0;
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
  }, [amount, direction, effectiveRate, showWithholding, withholdingPercent]);

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  function copySummary() {
    const lines = [
      `${labels.baseAmount}: ${currency} ${fmt(results.baseAmount)}`,
      `${labels.vatRate}: %${effectiveRate}`,
      `${labels.vatAmount}: ${currency} ${fmt(results.vatAmount)}`,
    ];
    if (showWithholding && withholdingPercent > 0) {
      lines.push(
        `${labels.withholdingAmount} (%${withholdingPercent}): -${currency} ${fmt(results.withholdingAmount)}`,
        `${labels.collectedVat}: ${currency} ${fmt(results.collectedVat)}`,
        `${labels.payableAmount}: ${currency} ${fmt(results.payableAmount)}`,
      );
    } else {
      lines.push(`${labels.totalAmount}: ${currency} ${fmt(results.totalAmount)}`);
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
          {/* Currency & Direction Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.symbol}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                {labels.calculationType}
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDirection("exclusive")}
                  className={`min-h-[34px] rounded-lg transition active:scale-95 ${
                    direction === "exclusive"
                      ? "bg-white text-blue-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {labels.exclusive}
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("inclusive")}
                  className={`min-h-[34px] rounded-lg transition active:scale-95 ${
                    direction === "inclusive"
                      ? "bg-white text-blue-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {labels.inclusive}
                </button>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {direction === "exclusive" ? labels.baseAmount : labels.totalAmount}
            </label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-4 text-base font-bold text-slate-400">
                {currency}
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full min-h-[48px] rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-lg font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              />
            </div>
          </div>

          {/* Global VAT / Tax Rates */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {labels.vatRate} (VAT / GST / Sales Tax)
            </label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {GLOBAL_VAT_PRESETS.map((item) => (
                <button
                  key={item.rate}
                  type="button"
                  onClick={() => {
                    setVatRate(item.rate);
                    setCustomRate("");
                  }}
                  className={`min-h-[40px] rounded-xl border text-xs font-bold transition active:scale-95 ${
                    customRate === "" && vatRate === item.rate
                      ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="relative col-span-2 sm:col-span-1">
                <input
                  type="number"
                  placeholder={labels.customRate || "Custom"}
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className={`w-full min-h-[40px] rounded-xl border px-2 text-center text-xs font-bold outline-none focus:border-blue-500 ${
                    customRate !== ""
                      ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Withholding Tax Toggle & Selection */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-700">
                {labels.withholdingRate} (Withholding Tax / Stopaj)
              </span>
              <input
                type="checkbox"
                checked={showWithholding}
                onChange={(e) => setShowWithholding(e.target.checked)}
                className="h-4 w-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            {showWithholding && (
              <div className="grid grid-cols-5 gap-2 pt-1">
                {[
                  { label: "10%", val: 10 },
                  { label: "20%", val: 20 },
                  { label: "30%", val: 30 },
                  { label: "50%", val: 50 },
                  { label: "70%", val: 70 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setWithholdingPercent(item.val)}
                    className={`min-h-[36px] rounded-lg border text-xs font-semibold transition active:scale-95 ${
                      withholdingPercent === item.val
                        ? "border-blue-600 bg-white text-blue-700 shadow-2xs font-bold"
                        : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Calculation Results Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-sky-50/30 to-white p-5 shadow-xs">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900 border-b border-blue-100/80 pb-2">
              {labels.copySummary}
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>{labels.baseAmount}:</span>
                <span className="font-semibold text-slate-900">
                  {currency} {fmt(results.baseAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>{labels.vatAmount} (%{effectiveRate}):</span>
                <span className="font-semibold text-blue-600">
                  +{currency} {fmt(results.vatAmount)}
                </span>
              </div>

              {showWithholding && withholdingPercent > 0 && (
                <>
                  <div className="flex items-center justify-between text-amber-700">
                    <span>{labels.withholdingAmount} (%{withholdingPercent}):</span>
                    <span className="font-semibold">
                      -{currency} {fmt(results.withholdingAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>{labels.collectedVat}:</span>
                    <span className="font-semibold">
                      {currency} {fmt(results.collectedVat)}
                    </span>
                  </div>
                </>
              )}

              <div className="border-t border-slate-200/80 pt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {showWithholding && withholdingPercent > 0 ? labels.payableAmount : labels.totalAmount}:
                  </div>
                  {showWithholding && withholdingPercent > 0 && (
                    <div className="text-[11px] text-slate-500">
                      {labels.totalAmount}: {currency} {fmt(results.totalAmount)}
                    </div>
                  )}
                </div>
                <div className="text-2xl font-extrabold text-blue-700">
                  {currency} {fmt(showWithholding && withholdingPercent > 0 ? results.payableAmount : results.totalAmount)}
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
              {copied ? `✓ ${labels.copied}` : `📋 ${labels.copySummary}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
