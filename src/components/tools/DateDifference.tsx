"use client";

import { useMemo } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["dateDifference"] };
type Draft = { start: string; end: string };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / ms);
}

export default function DateDifference({ labels }: Props) {
  const [draft, setDraft, clear] = useToolDraft<Draft>("date-difference", {
    start: todayISO(),
    end: todayISO(),
  });

  const stats = useMemo(() => {
    if (!draft.start || !draft.end) return null;
    const a = new Date(draft.start + "T00:00:00");
    const b = new Date(draft.end + "T00:00:00");
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
    const days = Math.abs(daysBetween(a, b));
    const weeks = days / 7;
    const months = days / 30.4375;
    const years = days / 365.25;
    return { days, weeks, months, years };
  }, [draft.start, draft.end]);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.start}</span>
          <input
            type="date"
            value={draft.start}
            onChange={(e) => setDraft({ ...draft, start: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-400"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.end}</span>
          <input
            type="date"
            value={draft.end}
            onChange={(e) => setDraft({ ...draft, end: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-400"
          />
        </label>
      </div>
      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: labels.days, value: stats.days.toFixed(0) },
            { label: labels.weeks, value: stats.weeks.toFixed(2) },
            { label: labels.months, value: stats.months.toFixed(2) },
            { label: labels.years, value: stats.years.toFixed(2) },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-2xl font-bold tabular-nums text-slate-900">
                {card.value}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {card.label}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{labels.invalid}</p>
      )}
      <button type="button" onClick={clear} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
        {labels.clear}
      </button>
    </div>
  );
}
