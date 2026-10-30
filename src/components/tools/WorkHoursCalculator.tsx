"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  labels: Dictionary["tools"]["workHoursCalculator"];
};

type DayRow = {
  name: string;
  enabled: boolean;
  start: string;
  end: string;
  breakMin: number;
};

const DEFAULT_DAYS: DayRow[] = [
  { name: "Pazartesi", enabled: true, start: "08:30", end: "18:00", breakMin: 60 },
  { name: "Salı", enabled: true, start: "08:30", end: "18:00", breakMin: 60 },
  { name: "Çarşamba", enabled: true, start: "08:30", end: "18:00", breakMin: 60 },
  { name: "Perşembe", enabled: true, start: "08:30", end: "18:00", breakMin: 60 },
  { name: "Cuma", enabled: true, start: "08:30", end: "18:00", breakMin: 60 },
  { name: "Cumartesi", enabled: false, start: "09:00", end: "14:00", breakMin: 30 },
  { name: "Pazar", enabled: false, start: "09:00", end: "18:00", breakMin: 60 },
];

export default function WorkHoursCalculator({ labels }: Props) {
  const [days, setDays] = useState<DayRow[]>(DEFAULT_DAYS);
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
      return `${h} sa ${m > 0 ? `${m} dk` : ""}`;
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
  }, [days, standardDailyHours, hourlyWage, overtimeMultiplier]);

  function copySummary() {
    const lines = [
      "Haftalık Çalışma & Mesai Dökümü",
      "-------------------------------",
      `Toplam Net Çalışma: ${totals.fmtNet} (${totals.netHoursDecimal} Saat)`,
      `Toplam Fazla Mesai: ${totals.fmtOvertime} (${totals.overtimeHoursDecimal} Saat)`,
      `Toplam Mola: ${totals.fmtBreak}`,
    ];
    if (totals.wage > 0) {
      lines.push(
        `Normal Çalışma Ücreti: ₺${totals.regularPay.toFixed(2)}`,
        `Fazla Mesai Ücreti (%${(overtimeMultiplier - 1) * 100} Zamlı): ₺${totals.overtimePay.toFixed(2)}`,
        `TOPLAM HAKEDİŞ: ₺${totals.totalPay.toFixed(2)}`,
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
            Günlük Standart Mesai (Saat)
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
            Saatlik Ücret (₺) (Opsiyonel)
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
            Fazla Mesai Katsayısı
          </label>
          <select
            value={overtimeMultiplier}
            onChange={(e) => setOvertimeMultiplier(Number(e.target.value))}
            className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white px-3 text-slate-800 outline-none focus:border-blue-500 font-bold"
          >
            <option value={1.5}>%50 Zamlı (1.5x) - Standart Yasal</option>
            <option value={2.0}>%100 Zamlı (2.0x) - Hafta Tatili / Resmi</option>
            <option value={1.0}>1.0x (Zamsız Düz Saat)</option>
          </select>
        </div>
      </div>

      {/* Days Table (Responsive Cards on Mobile) */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Haftalık Çalışma Günleri
        </h4>

        <div className="space-y-2">
          {days.map((day, idx) => (
            <div
              key={day.name}
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
                  {day.name}
                </span>
              </div>

              {day.enabled ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Giriş:</span>
                    <input
                      type="time"
                      value={day.start}
                      onChange={(e) => updateDay(idx, { start: e.target.value })}
                      className="rounded-lg border border-slate-200 px-2 py-1 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Çıkış:</span>
                    <input
                      type="time"
                      value={day.end}
                      onChange={(e) => updateDay(idx, { end: e.target.value })}
                      className="rounded-lg border border-slate-200 px-2 py-1 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Mola (dk):</span>
                    <input
                      type="number"
                      step={15}
                      value={day.breakMin}
                      onChange={(e) => updateDay(idx, { breakMin: Number(e.target.value) })}
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 font-mono font-bold text-slate-800 text-center"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Tatil / İzinli Gün</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Results Card */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-sky-50/30 to-white p-5 shadow-xs">
        <h4 className="text-sm font-bold uppercase tracking-wider text-blue-900 border-b border-blue-100/80 pb-2 mb-4">
          Haftalık Toplam Döküm
        </h4>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 font-medium">Net Çalışma Süresi</span>
            <div className="text-lg font-extrabold text-slate-900">{totals.fmtNet}</div>
            <div className="text-[11px] text-slate-400">{totals.netHoursDecimal} saat</div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-medium">Fazla Mesai (Overtime)</span>
            <div className="text-lg font-extrabold text-blue-600">{totals.fmtOvertime}</div>
            <div className="text-[11px] text-blue-500/80">{totals.overtimeHoursDecimal} saat</div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-medium">Toplam Mola Süresi</span>
            <div className="text-lg font-extrabold text-slate-700">{totals.fmtBreak}</div>
          </div>

          {totals.wage > 0 && (
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Toplam Hakediş</span>
              <div className="text-lg font-extrabold text-emerald-600">₺{totals.totalPay.toFixed(2)}</div>
              <div className="text-[11px] text-emerald-600/80">Mesai dahil</div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={copySummary}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-500 active:scale-95"
          >
            {copied ? "✓ Döküm Kopyalandı!" : "📋 Özeti Panoya Kopyala"}
          </button>
        </div>
      </div>
    </div>
  );
}
