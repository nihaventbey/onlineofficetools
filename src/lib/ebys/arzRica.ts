export type ArzRicaAudience =
  | "lower"
  | "upper"
  | "peer"
  | "mixed"
  | "private";

export type ArzRicaVariant = "plain" | "geregi" | "bilgi";

const CLOSINGS: Record<ArzRicaAudience, string> = {
  lower: "Rica ederim.",
  upper: "Arz ederim.",
  peer: "Arz ederim.",
  mixed: "Arz ve rica ederim.",
  private: "Saygılarımla.",
};

const FORBIDDEN_PATTERNS = [
  /bilgilerinizi\s+rica\s+ederim/i,
  /gereğini\s+rica\s+ederim/i,
  /bilgilerinizi\s+arz\s+ederim/i,
];

export function closingForAudience(audience: ArzRicaAudience): string {
  return CLOSINGS[audience];
}

export function formatClosing(
  audience: ArzRicaAudience,
  variant: ArzRicaVariant,
): string {
  const base = closingForAudience(audience);
  if (variant === "geregi") {
    if (audience === "lower") return "Gereğini rica ederim.";
    if (audience === "mixed") return "Gereğini arz ve rica ederim.";
    if (audience === "private") return "Gereğini saygılarımla arz ederim.";
    return "Gereğini arz ederim.";
  }
  if (variant === "bilgi") {
    // Avoid the common incorrect “Bilgilerinizi rica ederim.”
    if (audience === "lower") return "Bilgi için gereğini rica ederim.";
    if (audience === "mixed") return "Bilgilerinize arz ve rica ederim.";
    if (audience === "private") return "Bilgilerinize sunarım.";
    return "Bilgilerinize arz ederim.";
  }
  return base;
}

/** Detect phrases that conflict with classic yazışma etiquette. */
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
    /(^|\n)((Gereğini|Bilgilerinize|Bilgilerinizi|Saygılarımla).{0,40}?(arz|rica|sunarım).{0,20}\.?|Arz ederim\.|Rica ederim\.|Arz ve rica ederim\.|Saygılarımla\.)\s*$/i;
  if (closingRe.test(trimmed)) {
    return trimmed.replace(closingRe, `$1${closing}`);
  }
  if (!trimmed) return closing;
  return `${trimmed}\n\n${closing}`;
}
