import fs from "node:fs";
import path from "node:path";

const en = {
  title: "Arz / Rica",
  description:
    "Pick sender and recipient institutions to see who should use arz vs rica.",
  metaTitle: "Arz / Rica — Official Docs Helper",
  metaDescription:
    "Suggest Turkish official closing phrases from a DETSIS institution pair.",
  copy: "Copy",
  copied: "Copied!",
  clear: "Clear",
  senderLabel: "Sender institution",
  recipientLabel: "Add recipient",
  searchPlaceholder: "Search name or DETSIS id…",
  noResults: "No matches.",
  addRecipientHint: "Pick recipients from search; you can add several.",
  removeRecipient: "Remove",
  kindIdare: "Public body",
  kindPrivate: "Private entity",
  kindPerson: "Natural person",
  delegatorToggle: "Signed as (a.) — pick the delegating authority",
  delegatorLabel: "Delegating authority",
  manualOverride: "Override relation (optional)",
  manualAuto: "Automatic",
  relLower: "Lower (rica)",
  relUpper: "Upper (arz)",
  relPeer: "Peer (arz)",
  relMixed: "Mixed distribution",
  relUncertain: "Uncertain → arz",
  resultHeading: "Result",
  relationLabel: "Relation",
  confidenceLabel: "Confidence",
  confidenceAutomatic: "From hierarchy tree",
  confidenceRule: "Guide rule",
  confidenceUncertain: "Uncertain → arz",
  confidenceManual: "Manual",
  variantLabel: "Closing variants",
  closingLabel: "Closing",
  apply: "Apply to text",
  textPlaceholder: "Paste your draft…",
  forbiddenWarning: "Discouraged phrase",
  disclaimer:
    "Suggestion only; follow your institution’s protocol. (Regulation art. 16 / Official correspondence guide)",
  snapshotWarning:
    "DETSIS snapshot may be incomplete. Official source is detsis.gov.tr.",
};

const copyMap = {
  en: en,
  de: { ...en, copy: "Kopieren", copied: "Kopiert!", clear: "Leeren" },
  fr: { ...en, copy: "Copier", copied: "Copié !", clear: "Effacer" },
  es: { ...en, copy: "Copiar", copied: "¡Copiado!", clear: "Borrar" },
  it: { ...en, copy: "Copia", copied: "Copiato!", clear: "Cancella" },
  pt: { ...en, copy: "Copiar", copied: "Copiado!", clear: "Limpar" },
  ru: { ...en, copy: "Копировать", copied: "Скопировано!", clear: "Очистить" },
};

const dir = path.resolve("src/dictionaries");
for (const [loc, block] of Object.entries(copyMap)) {
  const p = path.join(dir, `${loc}.json`);
  const d = JSON.parse(fs.readFileSync(p, "utf8"));
  d.tools.arzRica = block;
  fs.writeFileSync(p, `${JSON.stringify(d, null, 2)}\n`);
  console.log("ok", loc);
}
