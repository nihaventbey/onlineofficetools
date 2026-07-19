"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import {
  applyClosing,
  findForbiddenPhrases,
  resolveRelation,
  type HierarchyRelation,
  type OrgParty,
  type RecipientKind,
} from "@/lib/ebys/arzRicaRelation";
import DetsisPicker from "@/components/tools/DetsisPicker";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["arzRica"] };

type CatalogPayload = {
  incomplete?: boolean;
  entries: OrgParty[];
};

const MANUAL: { id: HierarchyRelation; key: keyof Props["labels"] }[] = [
  { id: "lower", key: "relLower" },
  { id: "upper", key: "relUpper" },
  { id: "peer", key: "relPeer" },
  { id: "mixed", key: "relMixed" },
  { id: "uncertain", key: "relUncertain" },
];

const CONFIDENCE_KEY: Record<
  string,
  keyof Props["labels"]
> = {
  automatic: "confidenceAutomatic",
  rule: "confidenceRule",
  uncertain_arz: "confidenceUncertain",
  manual: "confidenceManual",
};

export default function ArzRica({ labels }: Props) {
  const [text, setText, clearText] = useToolDraft("arz-rica", "");
  const [catalog, setCatalog] = useState<OrgParty[]>([]);
  const [incomplete, setIncomplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sender, setSender] = useState<OrgParty | null>(null);
  const [recipients, setRecipients] = useState<OrgParty[]>([]);
  const [draftRecipient, setDraftRecipient] = useState<OrgParty | null>(null);
  const [delegator, setDelegator] = useState<OrgParty | null>(null);
  const [useDelegator, setUseDelegator] = useState(false);
  const [recipientKind, setRecipientKind] = useState<RecipientKind>("idare");
  const [manualRelation, setManualRelation] = useState<HierarchyRelation | null>(
    null,
  );
  const [selectedClosing, setSelectedClosing] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    setRecipients((prev) => {
      if (prev.some((p) => p.id === draftRecipient.id)) return prev;
      return [...prev, draftRecipient];
    });
    setDraftRecipient(null);
  }, [draftRecipient]);

  const result = useMemo(
    () =>
      resolveRelation(
        {
          sender,
          recipients,
          signingAsDelegator: useDelegator ? delegator : null,
          recipientKind,
          manualRelation,
        },
        catalog,
      ),
    [
      sender,
      recipients,
      useDelegator,
      delegator,
      recipientKind,
      manualRelation,
      catalog,
    ],
  );

  useEffect(() => {
    setSelectedClosing(null);
  }, [result.closing, result.relation, recipientKind]);

  const closing = selectedClosing ?? result.closing;
  const forbidden = useMemo(() => findForbiddenPhrases(text), [text]);

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
    setText(applyClosing(text, closing));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text || closing);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function clearAll() {
    clearText();
    setSender(null);
    setRecipients([]);
    setDelegator(null);
    setUseDelegator(false);
    setManualRelation(null);
    setRecipientKind("idare");
    setSelectedClosing(null);
  }

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      {incomplete ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {labels.snapshotWarning}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <DetsisPicker
          label={labels.senderLabel}
          value={sender}
          onChange={setSender}
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
          {recipients.length ? (
            <ul className="space-y-1.5">
              {recipients.map((r) => (
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
                      setRecipients((prev) => prev.filter((x) => x.id !== r.id))
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
            onClick={() => setRecipientKind(id)}
            className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${
              recipientKind === id
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
          checked={useDelegator}
          onChange={(e) => setUseDelegator(e.target.checked)}
        />
        {labels.delegatorToggle}
      </label>
      {useDelegator ? (
        <DetsisPicker
          label={labels.delegatorLabel}
          value={delegator}
          onChange={setDelegator}
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
            onClick={() => setManualRelation(null)}
            className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${
              manualRelation === null
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
              onClick={() => setManualRelation(id)}
              className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${
                manualRelation === id
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
              onClick={() => setSelectedClosing(v.text)}
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

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={labels.textPlaceholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-amber-400 focus:ring-2"
      />

      {forbidden.length ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
        >
          {labels.forbiddenWarning}:{" "}
          {forbidden.map((f) => `“${f}”`).join(", ")}
        </p>
      ) : null}

      <p className="text-xs text-slate-500">{labels.disclaimer}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleApply}
          className="min-h-10 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700"
        >
          {labels.apply}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {copied ? labels.copied : labels.copy}
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="min-h-10 rounded-xl px-4 text-sm font-medium text-slate-500 hover:bg-slate-50"
        >
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
