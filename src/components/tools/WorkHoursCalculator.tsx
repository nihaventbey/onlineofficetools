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
  { key: "mon", enabled: true, start: "08:30", end: "18:00", breakMin: 60 },
  { key: "tue", enabled: true, start: "08:30", end: "18:00", breakMin: 60 },
  { key: "wed", enabled: true, start: "08:30", end: "18:00", breakMin: 60 },
  { key: "thu", enabled: true, start: "08:30", end: "18:00", breakMin: 60 },
  { key: "fri", enabled: true, start: "08:30", end: "18:00", breakMin: 60 },
  { key: "sat", enabled: false, start: "09:00", end: "14:00", breakMin: 30 },
  { key: "sun", enabled: false, start: "09:00", end: "18:00", breakMin: 60 },
];

export default function WorkHoursCalculator({ labels }: Props) {
  const [days, setDays] = useState<DayRow[]>(INITIAL_DAYS);
  const [standardDailyHours, setStandardDailyHours] = useState<number>(8.5);
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
        `${labels.regularPay}: ${totals.regularPay.toFixed(2)}`,
        `${labels.overtimePay}: ${totals.overtimePay.toFixed(2)}`,
        `${labels.totalPay}: ${totals.totalPay.toFixed(2)}`,
      );
    }
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {/* Configuration Settings */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-2xl bg-slate-50 p-4 text-xs font-semibold">
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">
            {labels.standardDailyHours}
          </label>
          <input
            type="number"
            step="0.5"
            value={standardDailyHours}
            onChange={(e) => setStandardDailyHours(Number(e.target.value))}
            className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white px-3 text-slate-800 outline-none focus:border-blue-500 font-bold"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1.5">
            {labels.hourlyWage}
          </label>
          <input
            type="text"
            value={hourlyWage}
            onChange={(e) => setHourlyWage(e.target.value)}
            placeholder="0.00"
            className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white px-3 text-slate-800 outline-none focus:border-blue-500 font-bold"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1.5">
            {labels.overtimeMultiplier}
          </label>
          <select
            value={overtimeMultiplier}
            onChange={(e) => setOvertimeMultiplier(Number(e.target.value))}
            className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white px-3 text-slate-800 outline-none focus:border-blue-500 font-bold"
          >
            <option value={1.5}>1.5x (150%)</option>
            <option value={2.0}>2.0x (200%)</option>
            <option value={1.0}>1.0x (100%)</option>
          </select>
        </div>
      </div>

      {/* Days Table (Responsive Cards on Mobile) */}
      <div className="space-y-2">
        <div className="space-y-2">
          {days.map((day, idx) => (
            <div
              key={day.key}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3 text-xs transition ${
                day.enabled
                  ? "border-slate-200 bg-white shadow-2xs"
                  : "border-slate-100 bg-slate-50/50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-[130px]">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) => updateDay(idx, { enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`font-bold ${day.enabled ? "text-slate-900" : "text-slate-400"}`}>
                  {labels.days[day.key]}
                </span>
              </div>

              {day.enabled && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">{labels.startTime}:</span>
                    <input
                      type="time"
                      value={day.start}
                      onChange={(e) => updateDay(idx, { start: e.target.value })}
                      className="rounded-lg border border-slate-200 px-2 py-1 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">{labels.endTime}:</span>
                    <input
                      type="time"
                      value={day.end}
                      onChange={(e) => updateDay(idx, { end: e.target.value })}
                      className="rounded-lg border border-slate-200 px-2 py-1 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">{labels.breakMinutes}:</span>
                    <input
                      type="number"
                      step={15}
                      value={day.breakMin}
                      onChange={(e) => updateDay(idx, { breakMin: Number(e.target.value) })}
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 font-mono font-bold text-slate-800 text-center"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Results Card */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-sky-50/30 to-white p-5 shadow-xs">
        <h4 className="text-sm font-bold uppercase tracking-wider text-blue-900 border-b border-blue-100/80 pb-2 mb-4">
          {labels.summaryTitle}
        </h4>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 font-medium">{labels.totalNetHours}</span>
            <div className="text-lg font-extrabold text-slate-900">{totals.fmtNet}</div>
            <div className="text-[11px] text-slate-400">{totals.netHoursDecimal} {labels.hoursUnit}</div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-medium">{labels.totalOvertime}</span>
            <div className="text-lg font-extrabold text-blue-600">{totals.fmtOvertime}</div>
            <div className="text-[11px] text-blue-500/80">{totals.overtimeHoursDecimal} {labels.hoursUnit}</div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-medium">{labels.totalBreak}</span>
            <div className="text-lg font-extrabold text-slate-700">{totals.fmtBreak}</div>
          </div>

          {totals.wage > 0 && (
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">{labels.totalPay}</span>
              <div className="text-lg font-extrabold text-emerald-600">{totals.totalPay.toFixed(2)}</div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={copySummary}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-500 active:scale-95"
          >
            {copied ? `✓ ${labels.copied}` : `📋 ${labels.copySummary}`}
          </button>
        </div>
      </div>
    </div>
  );
}
