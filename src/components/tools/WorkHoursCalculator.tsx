"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  labels: Dictionary["tools"]["workHoursCalculator"];
};

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type DayRow = {
  key: DayKey;
  enabled: boolean;
  start: string;
  end: string;
  breakMin: number;
};

const INITIAL_DAYS: DayRow[] = [
  { key: "mon", enabled: true, start: "09:00", end: "17:30", breakMin: 60 },
  { key: "tue", enabled: true, start: "09:00", end: "17:30", breakMin: 60 },
  { key: "wed", enabled: true, start: "09:00", end: "17:30", breakMin: 60 },
  { key: "thu", enabled: true, start: "09:00", end: "17:30", breakMin: 60 },
  { key: "fri", enabled: true, start: "09:00", end: "17:30", breakMin: 60 },
  { key: "sat", enabled: false, start: "09:00", end: "14:00", breakMin: 30 },
  { key: "sun", enabled: false, start: "09:00", end: "18:00", breakMin: 60 },
];

const CURRENCIES = ["$", "€", "£", "₺", "₹", "¥", "A$", "C$"];

export default function WorkHoursCalculator({ labels }: Props) {
  const [days, setDays] = useState<DayRow[]>(INITIAL_DAYS);
  const [standardDailyHours, setStandardDailyHours] = useState<number>(8.0);
  const [currency, setCurrency] = useState<string>("$");
  const [hourlyWage, setHourlyWage] = useState<string>("0");
  const [overtimeMultiplier, setOvertimeMultiplier] = useState<number>(1.5);
  const [copied, setCopied] = useState<boolean>(false);

  function updateDay(idx: number, patch: Partial<DayRow>) {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  const totals = useMemo(() => {
    let totalGrossMinutes = 0;
    let totalBreakMinutes = 0;
    let totalNetMinutes = 0;
    let totalOvertimeMinutes = 0;

    const stdDailyMin = standardDailyHours * 60;

    for (const d of days) {
      if (!d.enabled) continue;
      const [sh, sm] = d.start.split(":").map(Number);
      const [eh, em] = d.end.split(":").map(Number);

      if (sh === undefined || sm === undefined || eh === undefined || em === undefined) continue;

      let startMin = sh * 60 + sm;
      let endMin = eh * 60 + em;
      if (endMin < startMin) {
        endMin += 24 * 60; // Next day shift
      }

      const gross = Math.max(0, endMin - startMin);
      const net = Math.max(0, gross - (d.breakMin || 0));
      const overtime = Math.max(0, net - stdDailyMin);

      totalGrossMinutes += gross;
      totalBreakMinutes += d.breakMin || 0;
      totalNetMinutes += net;
      totalOvertimeMinutes += overtime;
    }

    const wage = parseFloat(hourlyWage.replace(",", ".")) || 0;
    const regularMinutes = totalNetMinutes - totalOvertimeMinutes;
    const regularPay = (regularMinutes / 60) * wage;
    const overtimePay = (totalOvertimeMinutes / 60) * wage * overtimeMultiplier;
    const totalPay = regularPay + overtimePay;

    const fmtHours = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      return `${h} ${labels.hoursUnit} ${m > 0 ? `${m} ${labels.minsUnit}` : ""}`;
    };

    return {
      fmtGross: fmtHours(totalGrossMinutes),
      fmtBreak: fmtHours(totalBreakMinutes),
      fmtNet: fmtHours(totalNetMinutes),
      fmtOvertime: fmtHours(totalOvertimeMinutes),
      netHoursDecimal: (totalNetMinutes / 60).toFixed(2),
      overtimeHoursDecimal: (totalOvertimeMinutes / 60).toFixed(2),
      regularPay,
      overtimePay,
      totalPay,
      wage,
    };
  }, [days, standardDailyHours, hourlyWage, overtimeMultiplier, labels.hoursUnit, labels.minsUnit]);

  function copySummary() {
    const lines = [
      labels.summaryTitle,
      "-------------------------------",
      `${labels.totalNetHours}: ${totals.fmtNet} (${totals.netHoursDecimal} ${labels.hoursUnit})`,
      `${labels.totalOvertime}: ${totals.fmtOvertime} (${totals.overtimeHoursDecimal} ${labels.hoursUnit})`,
      `${labels.totalBreak}: ${totals.fmtBreak}`,
    ];
    if (totals.wage > 0) {
      lines.push(
        `${labels.regularPay}: ${currency} ${totals.regularPay.toFixed(2)}`,
        `${labels.overtimePay}: ${currency} ${totals.overtimePay.toFixed(2)}`,
        `${labels.totalPay}: ${currency} ${totals.totalPay.toFixed(2)}`,
      );
    }
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {/* Configuration Settings */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 rounded-2xl bg-slate-50 p-4 text-xs font-semibold">
        {/* Preset & Daily Hours */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">
            {labels.standardDailyHours}
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.5"
              value={standardDailyHours}
              onChange={(e) => setStandardDailyHours(Number(e.target.value))}
              className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white px-3 text-slate-800 outline-none focus:border-blue-500 font-bold"
            />
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setStandardDailyHours(8)}
                className={`rounded-lg px-2 py-1.5 text-[10px] font-bold border transition ${
                  standardDailyHours === 8 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"
                }`}
                title="40 hours / week (Standard)"
              >
                40h
              </button>
              <button
                type="button"
                onClick={() => setStandardDailyHours(7)}
                className={`rounded-lg px-2 py-1.5 text-[10px] font-bold border transition ${
                  standardDailyHours === 7 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"
                }`}
                title="35 hours / week (FR/EU)"
              >
                35h
              </button>
            </div>
          </div>
        </div>

        {/* Currency Selector */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white px-3 text-slate-800 outline-none focus:border-blue-500 font-bold"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Hourly Wage */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">
            {labels.hourlyWage}
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 text-slate-400 font-bold">
              {currency}
            </span>
            <input
              type="text"
              value={hourlyWage}
              onChange={(e) => setHourlyWage(e.target.value)}
              placeholder="0.00"
              className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-slate-800 outline-none focus:border-blue-500 font-bold"
            />
          </div>
        </div>

        {/* Overtime Multiplier */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">
            {labels.overtimeMultiplier}
          </label>
          <select
            value={overtimeMultiplier}
            onChange={(e) => setOvertimeMultiplier(Number(e.target.value))}
            className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white px-3 text-slate-800 outline-none focus:border-blue-500 font-bold"
          >
            <option value={1.5}>1.5x (150% - Standard)</option>
            <option value={2.0}>2.0x (200% - Double)</option>
            <option value={1.25}>1.25x (125%)</option>
            <option value={1.0}>1.0x (100% - Normal)</option>
          </select>
        </div>
      </div>

      {/* Daily Time Grid */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
            <tr>
              <th className="p-3 w-12 text-center">✓</th>
              <th className="p-3">Day</th>
              <th className="p-3">{labels.startTime}</th>
              <th className="p-3">{labels.endTime}</th>
              <th className="p-3">{labels.breakMinutes}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {days.map((row, idx) => (
              <tr
                key={row.key}
                className={`transition ${row.enabled ? "hover:bg-slate-50/70" : "bg-slate-50/40 opacity-50"}`}
              >
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => updateDay(idx, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="p-3 font-bold text-slate-800">
                  {labels.days[row.key]}
                </td>
                <td className="p-3">
                  <input
                    type="time"
                    disabled={!row.enabled}
                    value={row.start}
                    onChange={(e) => updateDay(idx, { start: e.target.value })}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500 disabled:bg-slate-100"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="time"
                    disabled={!row.enabled}
                    value={row.end}
                    onChange={(e) => updateDay(idx, { end: e.target.value })}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500 disabled:bg-slate-100"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="5"
                      min="0"
                      max="300"
                      disabled={!row.enabled}
                      value={row.breakMin}
                      onChange={(e) => updateDay(idx, { breakMin: Number(e.target.value) })}
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                    <span className="text-[11px] text-slate-400">
                      {labels.minsUnit}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {labels.totalNetHours}
          </p>
          <p className="mt-1 text-lg font-extrabold text-slate-900">
            {totals.fmtNet}
          </p>
          <p className="text-[11px] font-semibold text-slate-500">
            {totals.netHoursDecimal} {labels.hoursUnit}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            {labels.totalOvertime}
          </p>
          <p className="mt-1 text-lg font-extrabold text-amber-900">
            {totals.fmtOvertime}
          </p>
          <p className="text-[11px] font-semibold text-amber-700/80">
            {totals.overtimeHoursDecimal} {labels.hoursUnit}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {labels.totalBreak}
          </p>
          <p className="mt-1 text-lg font-extrabold text-slate-700">
            {totals.fmtBreak}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            {labels.totalPay}
          </p>
          <p className="mt-1 text-xl font-black text-blue-700">
            {currency} {totals.totalPay.toFixed(2)}
          </p>
          {totals.wage > 0 && (
            <p className="text-[10px] text-blue-600/80">
              {labels.regularPay}: {currency} {totals.regularPay.toFixed(2)} · {labels.overtimePay}: {currency} {totals.overtimePay.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Copy Summary Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={copySummary}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-500 active:scale-95"
        >
          {copied ? `✓ ${labels.copied}` : `📋 ${labels.copySummary}`}
        </button>
      </div>
    </div>
  );
}
