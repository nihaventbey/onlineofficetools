"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadText } from "@/lib/files/utils";

type Props = {
  labels: Dictionary["tools"]["loanCalculator"];
};

type PaymentRow = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

const CURRENCIES = ["$", "€", "£", "₺", "₹", "¥", "A$", "C$"];

export default function LoanCalculator({ labels }: Props) {
  const [currency, setCurrency] = useState<string>("$");
  const [loanAmount, setLoanAmount] = useState<string>("100000");
  const [interestRate, setInterestRate] = useState<string>("6.5");
  const [termYears, setTermYears] = useState<number>(15);
  const [termMonths, setTermMonths] = useState<number>(0);
  const [amortizationType, setAmortizationType] = useState<"annuity" | "linear">("annuity");
  const [copied, setCopied] = useState<boolean>(false);
  const [showFullSchedule, setShowFullSchedule] = useState<boolean>(false);

  const calculations = useMemo(() => {
    const P = parseFloat(loanAmount.replace(",", ".")) || 0;
    const annualRate = parseFloat(interestRate.replace(",", ".")) || 0;
    const totalMonths = termYears * 12 + termMonths;

    if (P <= 0 || totalMonths <= 0) {
      return {
        monthlyPayment: 0,
        firstPayment: 0,
        lastPayment: 0,
        totalInterest: 0,
        totalPayment: 0,
        principalPercent: 100,
        interestPercent: 0,
        schedule: [] as PaymentRow[],
      };
    }

    const r = annualRate / 100 / 12; // monthly interest rate
    const schedule: PaymentRow[] = [];
    let balance = P;
    let totalInterest = 0;

    if (amortizationType === "annuity") {
      // Equal monthly payments (French Annuity)
      const monthlyPayment =
        r > 0 ? (P * (r * Math.pow(1 + r, totalMonths))) / (Math.pow(1 + r, totalMonths) - 1) : P / totalMonths;

      for (let m = 1; m <= totalMonths; m++) {
        const interest = balance * r;
        const principal = monthlyPayment - interest;
        balance = Math.max(0, balance - principal);
        totalInterest += interest;

        schedule.push({
          month: m,
          payment: monthlyPayment,
          principal,
          interest,
          balance,
        });
      }

      const totalPayment = P + totalInterest;
      const principalPercent = totalPayment > 0 ? (P / totalPayment) * 100 : 100;
      const interestPercent = 100 - principalPercent;

      return {
        monthlyPayment,
        firstPayment: monthlyPayment,
        lastPayment: monthlyPayment,
        totalInterest,
        totalPayment,
        principalPercent,
        interestPercent,
        schedule,
      };
    } else {
      // Linear (Equal principal, decreasing payments)
      const fixedPrincipal = P / totalMonths;
      let firstPayment = 0;
      let lastPayment = 0;

      for (let m = 1; m <= totalMonths; m++) {
        const interest = balance * r;
        const payment = fixedPrincipal + interest;
        balance = Math.max(0, balance - fixedPrincipal);
        totalInterest += interest;

        if (m === 1) firstPayment = payment;
        if (m === totalMonths) lastPayment = payment;

        schedule.push({
          month: m,
          payment,
          principal: fixedPrincipal,
          interest,
          balance,
        });
      }

      const totalPayment = P + totalInterest;
      const principalPercent = totalPayment > 0 ? (P / totalPayment) * 100 : 100;
      const interestPercent = 100 - principalPercent;

      return {
        monthlyPayment: firstPayment,
        firstPayment,
        lastPayment,
        totalInterest,
        totalPayment,
        principalPercent,
        interestPercent,
        schedule,
      };
    }
  }, [loanAmount, interestRate, termYears, termMonths, amortizationType]);

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  function copySummary() {
    const lines = [
      `${labels.summaryTitle || "Loan Summary"}`,
      "--------------------------------",
      `${labels.loanAmount || "Loan Amount"}: ${currency} ${fmt(parseFloat(loanAmount) || 0)}`,
      `${labels.interestRate || "Interest Rate"}: %${interestRate}`,
      `${labels.term || "Term"}: ${termYears} ${labels.years || "Years"} ${termMonths > 0 ? `${termMonths} ${labels.months || "Months"}` : ""}`,
      `${labels.monthlyPayment || "Monthly Payment"}: ${currency} ${fmt(calculations.monthlyPayment)}`,
      `${labels.totalInterest || "Total Interest"}: ${currency} ${fmt(calculations.totalInterest)}`,
      `${labels.totalPayment || "Total Payment"}: ${currency} ${fmt(calculations.totalPayment)}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCsvSchedule() {
    if (!calculations.schedule.length) return;
    const headers = ["Month", "Payment", "Principal", "Interest", "Remaining Balance"];
    const rows = calculations.schedule.map((r) => [
      r.month,
      r.payment.toFixed(2),
      r.principal.toFixed(2),
      r.interest.toFixed(2),
      r.balance.toFixed(2),
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    downloadText(csvContent, "loan-amortization-schedule.csv");
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {/* 2-Column Main Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Currency & Amortization Type */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {labels.paymentPlan || "Plan Type"}
              </label>
              <select
                value={amortizationType}
                onChange={(e) => setAmortizationType(e.target.value as "annuity" | "linear")}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
              >
                <option value="annuity">Annuity (Equal Monthly)</option>
                <option value="linear">Linear (Decreasing)</option>
              </select>
            </div>
          </div>

          {/* Loan Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {labels.loanAmount || "Loan Amount"}
            </label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-4 text-base font-bold text-slate-400">
                {currency}
              </span>
              <input
                type="text"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="100000"
                className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-base font-bold text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Annual Interest Rate */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {labels.interestRate || "Annual Interest Rate"} (%)
            </label>
            <input
              type="text"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="6.5"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          {/* Term (Years & Months) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {labels.years || "Years"}
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={termYears}
                onChange={(e) => setTermYears(Number(e.target.value))}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {labels.months || "Months"}
              </label>
              <input
                type="number"
                min={0}
                max={11}
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Term Quick Presets */}
          <div className="flex gap-1.5 pt-1">
            {[5, 10, 15, 20, 30].map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => {
                  setTermYears(y);
                  setTermMonths(0);
                }}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition ${
                  termYears === y && termMonths === 0
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {y}y
              </button>
            ))}
          </div>
        </div>

        {/* Right Results Dashboard (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-sky-50/30 to-white p-5 shadow-xs space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-blue-100/80 pb-2">
              {labels.calculationResults || "Payment Summary"}
            </h3>

            {/* Big Highlight: Monthly Payment */}
            <div className="pt-3 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {labels.monthlyPayment || "Monthly Payment"}
              </span>
              <div className="text-3xl font-black text-blue-700 mt-0.5">
                {currency} {fmt(calculations.monthlyPayment)}
                {amortizationType === "linear" && (
                  <span className="text-xs font-semibold text-slate-500 ml-2">
                    ({labels.startsAt || "starts at"} {currency} {fmt(calculations.firstPayment)}, {labels.endsAt || "ends at"} {currency} {fmt(calculations.lastPayment)})
                  </span>
                )}
              </div>
            </div>

            {/* Principal vs Interest Breakdown */}
            <div className="space-y-2.5 text-sm border-t border-slate-200/80 pt-3">
              <div className="flex items-center justify-between text-slate-600">
                <span>{labels.loanAmount || "Principal Amount"}:</span>
                <span className="font-bold text-slate-900">
                  {currency} {fmt(parseFloat(loanAmount) || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>{labels.totalInterest || "Total Interest"}:</span>
                <span className="font-bold text-amber-700">
                  +{currency} {fmt(calculations.totalInterest)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-900 font-extrabold border-t border-slate-200/80 pt-2">
                <span>{labels.totalPayment || "Total Repayment"}:</span>
                <span className="text-lg text-slate-900">
                  {currency} {fmt(calculations.totalPayment)}
                </span>
              </div>

              {/* Progress Bar (Principal vs Interest) */}
              <div className="pt-2">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                  <span>Principal: {calculations.principalPercent.toFixed(1)}%</span>
                  <span>Interest: {calculations.interestPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-amber-200 flex">
                  <div
                    style={{ width: `${calculations.principalPercent}%` }}
                    className="h-full bg-blue-600"
                  />
                  <div
                    style={{ width: `${calculations.interestPercent}%` }}
                    className="h-full bg-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-blue-100">
            <button
              type="button"
              onClick={downloadCsvSchedule}
              disabled={!calculations.schedule.length}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40"
            >
              📥 {labels.downloadCsv || "Download CSV Schedule"}
            </button>

            <button
              type="button"
              onClick={copySummary}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500"
            >
              {copied ? `✓ ${labels.copied || "Copied!"}` : `📋 ${labels.copySummary || "Copy Summary"}`}
            </button>
          </div>
        </div>
      </div>

      {/* Amortization Schedule Table Toggle */}
      {calculations.schedule.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {labels.amortizationSchedule || "Amortization Schedule"} ({calculations.schedule.length} {labels.months || "Months"})
            </h4>
            <button
              type="button"
              onClick={() => setShowFullSchedule(!showFullSchedule)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              {showFullSchedule ? (labels.showLess || "Show First 12 Months") : (labels.showAll || "Show All Months")}
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">{labels.payment || "Payment"}</th>
                  <th className="p-3">{labels.principal || "Principal"}</th>
                  <th className="p-3">{labels.interest || "Interest"}</th>
                  <th className="p-3">{labels.remainingBalance || "Balance"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(showFullSchedule ? calculations.schedule : calculations.schedule.slice(0, 12)).map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-900">{row.month}</td>
                    <td className="p-3 font-semibold text-slate-900">
                      {currency} {fmt(row.payment)}
                    </td>
                    <td className="p-3 text-blue-700">
                      {currency} {fmt(row.principal)}
                    </td>
                    <td className="p-3 text-amber-700">
                      {currency} {fmt(row.interest)}
                    </td>
                    <td className="p-3 font-bold text-slate-700">
                      {currency} {fmt(row.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
