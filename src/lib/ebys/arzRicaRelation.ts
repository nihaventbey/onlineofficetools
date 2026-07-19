/** Party in a correspondence pair (typically a DETSİS entry). */
export type OrgParty = {
  id: string;
  name: string;
  parentId?: string;
  /** Optional classification for kılavuz fixed rules. */
  kind?: DetsisKind;
};

export type DetsisKind =
  | "cumhurbaskanligi"
  | "bakanlik"
  | "bagli"
  | "ilgili"
  | "tasra"
  | "diger";

export type RecipientKind = "idare" | "private" | "person";

/** How muhatap sits relative to gönderen. */
export type HierarchyRelation =
  | "lower"
  | "upper"
  | "peer"
  | "mixed"
  | "uncertain";

export type ClosingConfidence =
  | "automatic"
  | "rule"
  | "uncertain_arz"
  | "manual";

export type ClosingVariantId =
  | "plain"
  | "geregini"
  | "bilgilerini"
  | "bilgilerinize"
  | "bilgilerini_geregini"
  | "geregini_bilgilerinize";

export type ClosingVariant = {
  id: ClosingVariantId;
  text: string;
};

export type RelationInput = {
  sender: OrgParty | null;
  recipients: OrgParty[];
  /** When signing “Bakan a.” etc., use delegator’s hierarchy for the sender side. */
  signingAsDelegator?: OrgParty | null;
  recipientKind?: RecipientKind;
  /** Manual override of inferred relation. */
  manualRelation?: HierarchyRelation | null;
};

export type RelationResult = {
  relation: HierarchyRelation;
  closing: string;
  variants: ClosingVariant[];
  rationale: string;
  confidence: ClosingConfidence;
  summary: string;
};

const FORBIDDEN_PATTERNS = [
  /bilgilerinizi\s+rica\s+ederim/i,
  /bilgilerinizi\s+arz\s+ederim/i,
];

/** Infer kind from Turkish institution name when snapshot has no kind. */
export function inferKind(name: string, kind?: DetsisKind): DetsisKind {
  if (kind) return kind;
  const n = name.toLocaleLowerCase("tr-TR");
  if (/cumhurbaşkanlığı|cumhurbaskanligi/.test(n) && !/yardımc/.test(n)) {
    return "cumhurbaskanligi";
  }
  if (/bakanlığı|bakanligi/.test(n) && !/bağlı|bagli/.test(n)) {
    return "bakanlik";
  }
  if (/valiliği|valiligi|kaymakamlığı|kaymakamligi/.test(n)) {
    return "tasra";
  }
  if (
    /başkanlığı|baskanligi|genel müdürlüğü|genel mudurlugu|enstitüsü|enstitusu|kurumu|ajansı|ajansi/.test(
      n,
    )
  ) {
    // Could be bağlı/ilgili — treat as bagli for ministry→subordinate rule when paired
    return "bagli";
  }
  return "diger";
}

function ancestors(
  party: OrgParty,
  byId: Map<string, OrgParty>,
): Set<string> {
  const out = new Set<string>();
  let cur: OrgParty | undefined = party;
  let guard = 0;
  while (cur?.parentId && guard++ < 40) {
    out.add(cur.parentId);
    cur = byId.get(cur.parentId);
  }
  return out;
}

function depth(party: OrgParty, byId: Map<string, OrgParty>): number {
  let d = 0;
  let cur: OrgParty | undefined = party;
  while (cur?.parentId && d < 40) {
    d += 1;
    cur = byId.get(cur.parentId);
  }
  return d;
}

/** Pairwise relation: where is recipient relative to sender? */
export function pairRelation(
  sender: OrgParty,
  recipient: OrgParty,
  index: Map<string, OrgParty>,
): { relation: HierarchyRelation; confidence: ClosingConfidence; why: string } {
  const sKind = inferKind(sender.name, sender.kind);
  const rKind = inferKind(recipient.name, recipient.kind);

  // Kılavuz: Cumhurbaşkanlığı → (çoğu muhatap) rica
  if (sKind === "cumhurbaskanligi") {
    const n = recipient.name.toLocaleLowerCase("tr-TR");
    if (/tbmm|büyük millet|anayasa mah|yargıtay|danıştay|sayıştay|uyuşmazlık/.test(n)) {
      return {
        relation: "uncertain",
        confidence: "uncertain_arz",
        why: "Cumhurbaşkanlığı–üst yargı/TBMM istisnası; ilişki belirsiz, arz önerilir (manuel doğrulayın).",
      };
    }
    return {
      relation: "lower",
      confidence: "rule",
      why: "Kılavuz: Cumhurbaşkanlığı gönderilerinde metin sonu “… rica ederim.” ile biter.",
    };
  }

  // Kılavuz: Bakanlık → merkez/taşra/bağlı-ilgili → rica
  if (sKind === "bakanlik" && (rKind === "bagli" || rKind === "ilgili" || rKind === "tasra")) {
    return {
      relation: "lower",
      confidence: "rule",
      why: "Kılavuz: Bakanlıkların merkez/taşra ve bağlı-ilgili kuruluşlara yazılarında “… rica ederim.” kullanılır.",
    };
  }

  // Tree: recipient is ancestor of sender → muhatap üst
  const sAnc = ancestors(sender, index);
  if (recipient.id && sAnc.has(recipient.id)) {
    return {
      relation: "upper",
      confidence: "automatic",
      why: "DETSİS ağacında muhatap, gönderenin üstünde (ata).",
    };
  }
  // sender is ancestor of recipient → muhatap alt
  const rAnc = ancestors(recipient, index);
  if (sender.id && rAnc.has(sender.id)) {
    return {
      relation: "lower",
      confidence: "automatic",
      why: "DETSİS ağacında muhatap, gönderenin altında (torun).",
    };
  }

  // Same parent → peer (idare içi aynı düzey)
  if (
    sender.parentId &&
    recipient.parentId &&
    sender.parentId === recipient.parentId
  ) {
    return {
      relation: "peer",
      confidence: "automatic",
      why: "Aynı üst birime bağlı birimler; kılavuzda idare içi aynı düzey → arz ederim.",
    };
  }

  // Same id (same unit writing to itself) — treat as peer
  if (sender.id && sender.id === recipient.id) {
    return {
      relation: "peer",
      confidence: "automatic",
      why: "Aynı birim kaydı; arz ederim.",
    };
  }

  // Shared ancestor at similar depth → weak peer signal
  if (sender.parentId || recipient.parentId) {
    const sd = depth(sender, index);
    const rd = depth(recipient, index);
    if (sd > 0 && rd > 0 && Math.abs(sd - rd) === 0) {
      // still uncertain without shared parent
    }
  }

  return {
    relation: "uncertain",
    confidence: "uncertain_arz",
    why: "Ast-üst net değil (ek gösterge/protokol yok). Kılavuz: belirsizlikte “arz ederim” tercih edilir.",
  };
}

function closingForRelation(relation: HierarchyRelation): string {
  switch (relation) {
    case "lower":
      return "Rica ederim.";
    case "upper":
    case "peer":
    case "uncertain":
      return "Arz ederim.";
    case "mixed":
      return "Arz ve rica ederim.";
    default:
      return "Arz ederim.";
  }
}

function variantsForRelation(relation: HierarchyRelation): ClosingVariant[] {
  switch (relation) {
    case "lower":
      return [
        { id: "plain", text: "Rica ederim." },
        { id: "geregini", text: "Gereğini rica ederim." },
        { id: "bilgilerini", text: "Bilgilerini rica ederim." },
        { id: "bilgilerini_geregini", text: "Bilgilerini ve gereğini rica ederim." },
      ];
    case "mixed":
      return [
        { id: "plain", text: "Arz ve rica ederim." },
        { id: "geregini", text: "Gereğini arz ve rica ederim." },
        { id: "bilgilerini", text: "Bilgilerini arz ve rica ederim." },
        {
          id: "bilgilerini_geregini",
          text: "Bilgilerini ve gereğini arz/rica ederim.",
        },
      ];
    case "upper":
    case "peer":
    case "uncertain":
    default:
      return [
        { id: "plain", text: "Arz ederim." },
        { id: "bilgilerinize", text: "Bilgilerinize arz ederim." },
        { id: "geregini", text: "Gereğini bilgilerinize arz ederim." },
        { id: "bilgilerini_geregini", text: "Bilgilerini ve gereğini arz ederim." },
      ];
  }
}

function personVariants(): ClosingVariant[] {
  return [
    { id: "plain", text: "Saygılarımla." },
    { id: "bilgilerinize", text: "Bilgilerinize sunulur." },
    { id: "bilgilerini", text: "İyi dileklerimle." },
  ];
}

function privateVariants(): ClosingVariant[] {
  return [
    { id: "plain", text: "Rica ederim." },
    { id: "geregini", text: "Gereğini rica ederim." },
  ];
}

export function resolveRelation(
  input: RelationInput,
  catalog: OrgParty[] = [],
): RelationResult {
  const index = new Map<string, OrgParty>();
  for (const e of catalog) index.set(e.id, e);
  if (input.sender) index.set(input.sender.id, input.sender);
  for (const r of input.recipients) index.set(r.id, r);
  if (input.signingAsDelegator) {
    index.set(input.signingAsDelegator.id, input.signingAsDelegator);
  }

  const kind = input.recipientKind ?? "idare";

  if (kind === "person") {
    const variants = personVariants();
    return {
      relation: "peer",
      closing: variants[0].text,
      variants,
      rationale:
        "Yönetmelik MADDE 16: muhatabı gerçek kişi olan yazışmalar “Saygılarımla.” / “Bilgilerinize sunulur.” ile bitirilebilir.",
      confidence: "rule",
      summary: "Gerçek kişi muhatap → Saygılarımla.",
    };
  }

  if (kind === "private") {
    const variants = privateVariants();
    return {
      relation: "lower",
      closing: variants[0].text,
      variants,
      rationale:
        "Kılavuz: kamu niteliği olmayan tüzel kişilerle yazışmalar “… rica ederim.” ile bitirilir.",
      confidence: "rule",
      summary: "Özel hukuk tüzel kişi → rica ederim.",
    };
  }

  const effectiveSender = input.signingAsDelegator ?? input.sender;

  if (input.manualRelation) {
    const relation = input.manualRelation;
    const variants = variantsForRelation(relation);
    const closing = closingForRelation(relation);
    return {
      relation,
      closing,
      variants,
      rationale: "Manuel seçim; kurum protokolünüz esas alınmalıdır.",
      confidence: "manual",
      summary: summaryLine(effectiveSender, input.recipients, relation, closing),
    };
  }

  if (!effectiveSender || input.recipients.length === 0) {
    return {
      relation: "uncertain",
      closing: "Arz ederim.",
      variants: variantsForRelation("uncertain"),
      rationale: "Gönderen ve muhatap seçildiğinde ilişki hesaplanır.",
      confidence: "uncertain_arz",
      summary: "Kurum seçin",
    };
  }

  const pairs = input.recipients.map((r) =>
    pairRelation(effectiveSender, r, index),
  );
  const relations = new Set(pairs.map((p) => p.relation));

  let relation: HierarchyRelation;
  let confidence: ClosingConfidence;
  let why: string;

  if (relations.size > 1) {
    const hasLower = relations.has("lower");
    const hasUpperOrPeer =
      relations.has("upper") || relations.has("peer");
    if (hasLower && hasUpperOrPeer) {
      relation = "mixed";
      confidence = "rule";
      why =
        "Dağıtımda üst/aynı ve alt muhataplar birlikte; kılavuz: “arz ve rica ederim.” / “arz/rica ederim.”";
    } else if (hasLower && relations.has("uncertain")) {
      relation = "mixed";
      confidence = "rule";
      why =
        "Dağıtımda alt muhatap ile belirsiz/üst düzey muhataplar birlikte; arz ve rica önerilir.";
    } else if (hasUpperOrPeer && relations.has("uncertain")) {
      // Prefer arz (uncertain already maps to arz) — treat as peer/upper cluster
      relation = relations.has("upper") ? "upper" : "peer";
      confidence = "uncertain_arz";
      why =
        "Muhataplar üst/aynı veya belirsiz; arz ederim. Dağıtımı kurum protokolüne göre doğrulayın.";
    } else {
      relation = "mixed";
      confidence = "rule";
      why =
        "Birden fazla muhatap için farklı hiyerarşi sinyalleri; arz ve rica önerilir.";
    }
  } else {
    const only = pairs[0];
    relation = only.relation;
    confidence = only.confidence;
    why = only.why;
  }

  const closing = closingForRelation(relation);
  const variants = variantsForRelation(relation);

  return {
    relation,
    closing,
    variants,
    rationale: `${why} (Yönetmelik MADDE 16 / Resmî Yazışma Kılavuzu).`,
    confidence,
    summary: summaryLine(effectiveSender, input.recipients, relation, closing),
  };
}

function summaryLine(
  sender: OrgParty | null | undefined,
  recipients: OrgParty[],
  relation: HierarchyRelation,
  closing: string,
): string {
  const from = sender?.name ?? "Gönderen";
  const to =
    recipients.length === 0
      ? "muhatap"
      : recipients.length === 1
        ? recipients[0].name
        : `${recipients.length} muhatap`;
  const verb =
    relation === "lower"
      ? "rica"
      : relation === "mixed"
        ? "arz ve rica"
        : "arz";
  return `${from} → ${to}: ${verb} eder → ${closing}`;
}

export function findForbiddenPhrases(text: string): string[] {
  const hits: string[] = [];
  for (const re of FORBIDDEN_PATTERNS) {
    const m = text.match(re);
    if (m?.[0]) hits.push(m[0]);
  }
  return hits;
}

/** Replace a trailing closing line, or append one. */
export function applyClosing(text: string, closing: string): string {
  const trimmed = text.replace(/\s+$/, "");
  const closingRe =
    /(^|\n)((Gereğini|Bilgilerinize|Bilgilerini|Bilgilerinizi|Saygılarımla|İyi dileklerimle).{0,60}?(arz|rica|sunulur|sunarım).{0,20}\.?|Arz ederim\.|Rica ederim\.|Arz ve rica ederim\.|Arz\/rica ederim\.|Saygılarımla\.|İyi dileklerimle\.)\s*$/i;
  if (closingRe.test(trimmed)) {
    return trimmed.replace(closingRe, `$1${closing}`);
  }
  if (!trimmed) return closing;
  return `${trimmed}\n\n${closing}`;
}

/** @deprecated Prefer resolveRelation — kept for simple variant picks. */
export type ArzRicaAudience = HierarchyRelation | "private";
export type ArzRicaVariant = "plain" | "geregi" | "bilgi";

export function formatClosing(
  audience: ArzRicaAudience,
  variant: ArzRicaVariant,
): string {
  const relation: HierarchyRelation =
    audience === "private" ? "lower" : audience;
  const variants = audience === "private" ? privateVariants() : variantsForRelation(relation);
  if (variant === "plain") return variants[0]?.text ?? closingForRelation(relation);
  if (variant === "geregi") {
    return (
      variants.find((v) => v.id === "geregini")?.text ??
      variants[0]?.text ??
      closingForRelation(relation)
    );
  }
  return (
    variants.find((v) => v.id === "bilgilerinize" || v.id === "bilgilerini")
      ?.text ??
    variants[0]?.text ??
    closingForRelation(relation)
  );
}
