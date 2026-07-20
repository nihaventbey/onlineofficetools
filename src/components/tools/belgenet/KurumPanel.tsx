"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import {
  applyClosing,
  resolveRelation,
  type HierarchyRelation,
  type OrgParty,
} from "@/lib/ebys/arzRicaRelation";
import { useBelgenetDraft } from "@/lib/ebys/belgenetDraft";
import DetsisPicker from "@/components/tools/DetsisPicker";

type Labels = Dictionary["tools"]["belgenetPrep"]["kurum"];

type CatalogPayload = {
  incomplete?: boolean;
  entries: OrgParty[];
};

const MANUAL: { id: HierarchyRelation; key: keyof Labels }[] = [
  { id: "lower", key: "relLower" },
  { id: "upper", key: "relUpper" },
  { id: "peer", key: "relPeer" },
  { id: "mixed", key: "relMixed" },
  { id: "uncertain", key: "relUncertain" },
];

const CONFIDENCE_KEY: Record<string, keyof Labels> = {
  automatic: "confidenceAutomatic",
  rule: "confidenceRule",
  uncertain_arz: "confidenceUncertain",
  manual: "confidenceManual",
};

export default function KurumPanel({ labels }: { labels: Labels }) {
  const { draft, setDraft } = useBelgenetDraft();
  const [catalog, setCatalog] = useState<OrgParty[]>([]);
  const [incomplete, setIncomplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draftRecipient, setDraftRecipient] = useState<OrgParty | null>(null);
  const [selectedClosing, setSelectedClosing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/detsis.json")
      .then((r) => {
        if (!r.ok) throw new Error("fail");
        return r.json() as Promise<CatalogPayload>;
      })
      .then((json) => {
        if (cancelled) return;
        setCatalog(json.entries ?? []);
        setIncomplete(Boolean(json.incomplete));
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftRecipient) return;
    if (draft.recipients.some((p) => p.id === draftRecipient.id)) return;
    setDraft({ recipients: [...draft.recipients, draftRecipient] });
    setDraftRecipient(null);
  }, [draftRecipient, draft.recipients, setDraft]);

  const result = useMemo(
    () =>
      resolveRelation(
        {
          sender: draft.sender,
          recipients: draft.recipients,
          signingAsDelegator: draft.useDelegator ? draft.delegator : null,
          recipientKind: draft.recipientKind,
          manualRelation: draft.manualRelation,
        },
        catalog,
      ),
    [draft, catalog],
  );

  useEffect(() => {
    setSelectedClosing(null);
    setDraft({ closing: result.closing });
  }, [result.closing, result.relation, setDraft]);

  const closing = selectedClosing ?? result.closing;

  const relationLabel =
    labels[
      (
        {
          lower: "relLower",
          upper: "relUpper",
          peer: "relPeer",
          mixed: "relMixed",
          uncertain: "relUncertain",
        } as const
      )[result.relation]
    ];

  const confidenceLabel =
    labels[CONFIDENCE_KEY[result.confidence] ?? "confidenceUncertain"];

  function handleApply() {
    setDraft({
      html: applyClosing(draft.html, closing),
      closing,
    });
  }

  return (
    <div className="space-y-4">
      {incomplete ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {labels.snapshotWarning}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <DetsisPicker
          label={labels.senderLabel}
          value={draft.sender}
          onChange={(sender) => setDraft({ sender })}
          catalog={catalog}
          searchPlaceholder={labels.searchPlaceholder}
          clearLabel={labels.clear}
          noResults={labels.noResults}
          loading={loading}
        />
        <div className="space-y-2">
          <DetsisPicker
            label={labels.recipientLabel}
            value={null}
            onChange={setDraftRecipient}
            catalog={catalog}
            searchPlaceholder={labels.searchPlaceholder}
            clearLabel={labels.clear}
            noResults={labels.noResults}
            loading={loading}
          />
          {draft.recipients.length ? (
            <ul className="space-y-1.5">
              {draft.recipients.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5 text-sm"
                >
                  <span className="truncate">
                    <span className="font-mono text-xs text-slate-400">
                      {r.id}{" "}
                    </span>
                    {r.name}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-600"
                    onClick={() =>
                      setDraft({
                        recipients: draft.recipients.filter(
                          (x) => x.id !== r.id,
                        ),
                      })
                    }
                  >
                    {labels.removeRecipient}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">{labels.addRecipientHint}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["idare", labels.kindIdare],
            ["private", labels.kindPrivate],
            ["person", labels.kindPerson],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setDraft({ recipientKind: id })}
            className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${
              draft.recipientKind === id
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={draft.useDelegator}
          onChange={(e) => setDraft({ useDelegator: e.target.checked })}
        />
        {labels.delegatorToggle}
      </label>
      {draft.useDelegator ? (
        <DetsisPicker
          label={labels.delegatorLabel}
          value={draft.delegator}
          onChange={(delegator) => setDraft({ delegator })}
          catalog={catalog}
          searchPlaceholder={labels.searchPlaceholder}
          clearLabel={labels.clear}
          noResults={labels.noResults}
        />
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">
          {labels.manualOverride}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDraft({ manualRelation: null })}
            className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${
              draft.manualRelation === null
                ? "bg-amber-100 text-amber-900"
                : "bg-slate-50 text-slate-600"
            }`}
          >
            {labels.manualAuto}
          </button>
          {MANUAL.map(({ id, key }) => (
            <button
              key={id}
              type="button"
              onClick={() => setDraft({ manualRelation: id })}
              className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${
                draft.manualRelation === id
                  ? "bg-amber-100 text-amber-900"
                  : "bg-slate-50 text-slate-600"
              }`}
            >
              {labels[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-white px-4 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
          {labels.resultHeading}
        </p>
        <p className="mt-2 text-base font-semibold text-slate-900">
          {result.summary}
        </p>
        <p className="mt-2 text-sm text-slate-700">
          <span className="font-medium">{labels.relationLabel}:</span>{" "}
          {relationLabel}
          {" · "}
          <span className="font-medium">{labels.confidenceLabel}:</span>{" "}
          {confidenceLabel}
        </p>
        <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 font-serif text-lg text-slate-900">
          {closing}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          {result.rationale}
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">
          {labels.variantLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {result.variants.map((v) => (
            <button
              key={`${v.id}-${v.text}`}
              type="button"
              onClick={() => {
                setSelectedClosing(v.text);
                setDraft({ closing: v.text });
              }}
              className={`min-h-9 rounded-lg border px-3 text-xs font-semibold ${
                closing === v.text
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {v.text}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500">{labels.disclaimer}</p>

      <button
        type="button"
        onClick={handleApply}
        className="min-h-10 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700"
      >
        {labels.apply}
      </button>
    </div>
  );
}
