"use client";

import { useMemo } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["birthdayCalculator"] };
type Draft = { birth: string; asOf: string };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function parseLocal(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function ageParts(birth: Date, asOf: Date) {
  let years = asOf.getFullYear() - birth.getFullYear();
  let months = asOf.getMonth() - birth.getMonth();
  let days = asOf.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    const prev = new Date(asOf.getFullYear(), asOf.getMonth(), 0);
    days += prev.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
}

function nextBirthday(birth: Date, asOf: Date): { date: Date; daysUntil: number } {
  const candidate = new Date(asOf.getFullYear(), birth.getMonth(), birth.getDate());
  if (candidate < asOf) {
    candidate.setFullYear(asOf.getFullYear() + 1);
  }
  // Feb 29 → Feb 28 in non-leap years
  if (birth.getMonth() === 1 && birth.getDate() === 29 && candidate.getDate() !== 29) {
    candidate.setMonth(1, 28);
  }
  const ms = 24 * 60 * 60 * 1000;
  const daysUntil = Math.round((candidate.getTime() - asOf.getTime()) / ms);
  return { date: candidate, daysUntil };
}

export default function BirthdayCalculator({ labels }: Props) {
  const [draft, setDraft, clear] = useToolDraft<Draft>("birthday-calculator", {
    birth: "",
    asOf: todayISO(),
  });

  const weekdayNames = [
    labels.weekdaySun,
    labels.weekdayMon,
    labels.weekdayTue,
    labels.weekdayWed,
    labels.weekdayThu,
    labels.weekdayFri,
    labels.weekdaySat,
  ];

  const stats = useMemo(() => {
    const birth = parseLocal(draft.birth);
    const asOf = parseLocal(draft.asOf);
    if (!birth || !asOf || asOf < birth) return null;
    const age = ageParts(birth, asOf);
    const next = nextBirthday(birth, asOf);
    return {
      age,
      nextDays: next.daysUntil,
      nextIso: next.date.toISOString().slice(0, 10),
      weekday: weekdayNames[birth.getDay()] ?? "",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.birth, draft.asOf]);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.birthDate}</span>
          <input
            type="date"
            value={draft.birth}
            max={draft.asOf || todayISO()}
            onChange={(e) => setDraft({ ...draft, birth: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-cyan-400"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.asOf}</span>
          <input
            type="date"
            value={draft.asOf}
            onChange={(e) => setDraft({ ...draft, asOf: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-cyan-400"
          />
        </label>
      </div>

      {stats ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: labels.years, value: String(stats.age.years) },
              { label: labels.months, value: String(stats.age.months) },
              { label: labels.days, value: String(stats.age.days) },
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-cyan-50/60 p-4">
              <p className="text-sm font-medium text-slate-600">
                {labels.nextBirthday}
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                {stats.nextDays === 0
                  ? labels.todayIsBirthday
                  : `${stats.nextDays} ${labels.daysUntil}`}
              </p>
              <p className="mt-1 text-xs text-slate-500">{stats.nextIso}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">
                {labels.bornWeekday}
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {stats.weekday}
              </p>
            </div>
          </div>
        </div>
      ) : draft.birth ? (
        <p className="text-sm text-red-600">{labels.invalid}</p>
      ) : (
        <p className="text-sm text-slate-500">{labels.hint}</p>
      )}

      <button
        type="button"
        onClick={clear}
        className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium"
      >
        {labels.clear}
      </button>
    </div>
  );
}
