"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { findForbiddenPhrases } from "@/lib/ebys/arzRicaRelation";
import { estimatePageFit } from "@/lib/ebys/pageFitEstimate";
import { belgenetHtmlToPlain } from "@/lib/ebys/sanitizeBelgenetHtml";
import { useBelgenetDraft } from "@/lib/ebys/belgenetDraft";

type Labels = Dictionary["tools"]["belgenetPrep"]["ozet"];

export default function OzetPanel({ labels }: { labels: Labels }) {
  const { draft } = useBelgenetDraft();
  const [copied, setCopied] = useState(false);

  const fit = useMemo(
    () =>
      estimatePageFit({
        html: draft.html,
        font: draft.font,
        fontSizePt: draft.fontSize,
      }),
    [draft.html, draft.font, draft.fontSize],
  );

  const plain = useMemo(() => belgenetHtmlToPlain(draft.html), [draft.html]);
  const forbidden = useMemo(() => findForbiddenPhrases(plain), [plain]);

  const subjectLine = draft.sdpCode
    ? `Konu: ${draft.sdpName ?? "—"} — SDP ${draft.sdpCode}`
    : null;

  async function copySubject() {
    if (!subjectLine) return;
    try {
      await navigator.clipboard.writeText(subjectLine);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <p className="font-semibold text-slate-900">{labels.checklistHeading}</p>
        <ul className="mt-2 space-y-2 text-slate-700">
          <li>
            {draft.sender ? "✓" : "○"} {labels.checkSender}:{" "}
            {draft.sender?.name ?? labels.notSet}
          </li>
          <li>
            {draft.recipients.length ? "✓" : "○"} {labels.checkRecipient}:{" "}
            {draft.recipients.length
              ? draft.recipients.map((r) => r.name).join(", ")
              : labels.notSet}
          </li>
          <li>
            {draft.closing ? "✓" : "○"} {labels.checkClosing}:{" "}
            {draft.closing ?? labels.notSet}
          </li>
          <li>
            {draft.sdpCode ? "✓" : "○"} {labels.checkSdp}:{" "}
            {draft.sdpCode ?? labels.notSet}
          </li>
          <li>
            {fit.fitsFirstPage ? "✓" : "⚠"} {labels.checkPageFit}:{" "}
            {fit.fitsFirstPage ? labels.fitOk : labels.fitOverflow}
          </li>
        </ul>
      </div>

      {subjectLine ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-amber-800">
            {labels.subjectLineHeading}
          </p>
          <p className="mt-1 font-mono text-sm text-slate-900">{subjectLine}</p>
          <button
            type="button"
            onClick={copySubject}
            className="mt-2 min-h-9 rounded-lg bg-amber-700 px-3 text-xs font-semibold text-white"
          >
            {copied ? labels.copied : labels.copySubject}
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">{labels.subjectLineHint}</p>
      )}

      {forbidden.length ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
        >
          {labels.forbiddenWarning}: {forbidden.map((f) => `“${f}”`).join(", ")}
        </p>
      ) : null}

      <p className="text-xs text-slate-500">{labels.disclaimer}</p>
    </div>
  );
}
