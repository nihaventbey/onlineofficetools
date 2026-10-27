/** Browser-side DOCX comparison: paragraphs, words, and basic style flags. */

export type StyleFlags = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

export type DocBlock = {
  text: string;
  styles: StyleFlags;
};

export type WordMark = {
  text: string;
  type: "same" | "add" | "del";
};

export type CompareRow = {
  kind: "same" | "changed" | "added" | "removed" | "style";
  left: string;
  right: string;
  leftWords?: WordMark[];
  rightWords?: WordMark[];
  styleChanges?: string[];
};

export type CompareSummary = {
  paragraphsCompared: number;
  textChanges: number;
  styleOnlyChanges: number;
  added: number;
  removed: number;
  identical: boolean;
};

export type CompareResult = {
  rows: CompareRow[];
  summary: CompareSummary;
};

const emptyStyle = (): StyleFlags => ({
  bold: false,
  italic: false,
  underline: false,
});

function stylesEqual(a: StyleFlags, b: StyleFlags): boolean {
  return a.bold === b.bold && a.italic === b.italic && a.underline === b.underline;
}

/** LCS length table for generic sequences. */
function lcsTable<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i]![j] = eq(a[i]!, b[j]!)
        ? dp[i + 1]![j + 1]! + 1
        : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }
  return dp;
}

function tokenizeWords(text: string): string[] {
  return text.match(/\S+|\s+/g) ?? [];
}

export function diffWords(a: string, b: string): {
  left: WordMark[];
  right: WordMark[];
} {
  const leftTok = tokenizeWords(a);
  const rightTok = tokenizeWords(b);
  const dp = lcsTable(leftTok, rightTok, (x, y) => x === y);
  const left: WordMark[] = [];
  const right: WordMark[] = [];
  let i = 0;
  let j = 0;
  while (i < leftTok.length && j < rightTok.length) {
    if (leftTok[i] === rightTok[j]) {
      left.push({ text: leftTok[i]!, type: "same" });
      right.push({ text: rightTok[j]!, type: "same" });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      left.push({ text: leftTok[i]!, type: "del" });
      i++;
    } else {
      right.push({ text: rightTok[j]!, type: "add" });
      j++;
    }
  }
  while (i < leftTok.length) left.push({ text: leftTok[i++]!, type: "del" });
  while (j < rightTok.length) right.push({ text: rightTok[j++]!, type: "add" });
  return { left, right };
}

function collectStyles(el: Element, acc: StyleFlags) {
  const tag = el.tagName.toLowerCase();
  if (tag === "strong" || tag === "b") acc.bold = true;
  if (tag === "em" || tag === "i") acc.italic = true;
  if (tag === "u") acc.underline = true;
  const style = el.getAttribute("style") ?? "";
  if (/font-weight\s*:\s*(bold|[6-9]00)/i.test(style)) acc.bold = true;
  if (/font-style\s*:\s*italic/i.test(style)) acc.italic = true;
  if (/text-decoration[^;]*underline/i.test(style)) acc.underline = true;
  for (const child of Array.from(el.children)) {
    collectStyles(child, acc);
  }
}

/** Parse mammoth HTML into paragraph-like blocks with style flags. */
export function htmlToBlocks(html: string): DocBlock[] {
  if (typeof DOMParser === "undefined") {
    return html
      .replace(/<[^>]+>/g, "\n")
      .split(/\n+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text, styles: emptyStyle() }));
  }
  const doc = new DOMParser().parseFromString(
    `<div id="root">${html}</div>`,
    "text/html",
  );
  const root = doc.getElementById("root") ?? doc.body;
  const blocks: DocBlock[] = [];
  const pushBlock = (el: Element) => {
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!text) return;
    const styles = emptyStyle();
    collectStyles(el, styles);
    blocks.push({ text, styles });
  };

  const blockTags = new Set([
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "li",
    "blockquote",
    "pre",
    "td",
    "th",
  ]);

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();
      if (blockTags.has(tag)) pushBlock(child);
      else if (tag === "ul" || tag === "ol" || tag === "table" || tag === "tr") {
        walk(child);
      } else if (tag === "div") {
        walk(child);
      } else {
        // nested wrappers
        const text = (child.textContent ?? "").replace(/\s+/g, " ").trim();
        if (text && !child.querySelector("p,h1,h2,h3,li")) pushBlock(child);
        else walk(child);
      }
    }
  };
  walk(root);

  if (!blocks.length) {
    const fallback = (root.textContent ?? "").replace(/\s+/g, " ").trim();
    if (fallback) blocks.push({ text: fallback, styles: emptyStyle() });
  }
  return blocks;
}

export async function extractDocxBlocks(file: File): Promise<{
  blocks: DocBlock[];
  plain: string;
}> {
  const mammoth = await import("mammoth");
  const buffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
  const blocks = htmlToBlocks(htmlResult.value);
  const plain = blocks.map((b) => b.text).join("\n");
  return { blocks, plain };
}

function styleChangeLabels(
  a: StyleFlags,
  b: StyleFlags,
  labels: {
    boldOn: string;
    boldOff: string;
    italicOn: string;
    italicOff: string;
    underlineOn: string;
    underlineOff: string;
  },
): string[] {
  const out: string[] = [];
  if (a.bold !== b.bold) out.push(b.bold ? labels.boldOn : labels.boldOff);
  if (a.italic !== b.italic)
    out.push(b.italic ? labels.italicOn : labels.italicOff);
  if (a.underline !== b.underline)
    out.push(b.underline ? labels.underlineOn : labels.underlineOff);
  return out;
}

export type StyleLabelSet = {
  boldOn: string;
  boldOff: string;
  italicOn: string;
  italicOff: string;
  underlineOn: string;
  underlineOff: string;
};

export function compareBlocks(
  left: DocBlock[],
  right: DocBlock[],
  styleLabels: StyleLabelSet,
): CompareResult {
  const dp = lcsTable(left, right, (a, b) => a.text === b.text);
  const rows: CompareRow[] = [];
  let i = 0;
  let j = 0;
  let styleOnly = 0;
  let added = 0;
  let removed = 0;

  while (i < left.length && j < right.length) {
    if (left[i]!.text === right[j]!.text) {
      const L = left[i]!;
      const R = right[j]!;
      if (!stylesEqual(L.styles, R.styles)) {
        styleOnly++;
        rows.push({
          kind: "style",
          left: L.text,
          right: R.text,
          styleChanges: styleChangeLabels(L.styles, R.styles, styleLabels),
        });
      } else {
        rows.push({ kind: "same", left: L.text, right: R.text });
      }
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      // Look ahead: if next right matches current left after a short add, treat as change
      // Simpler: emit remove; pairing with following add happens in a second pass
      removed++;
      rows.push({ kind: "removed", left: left[i]!.text, right: "" });
      i++;
    } else {
      added++;
      rows.push({ kind: "added", left: "", right: right[j]!.text });
      j++;
    }
  }
  while (i < left.length) {
    removed++;
    rows.push({ kind: "removed", left: left[i++]!.text, right: "" });
  }
  while (j < right.length) {
    added++;
    rows.push({ kind: "added", left: "", right: right[j++]!.text });
  }

  // Pair adjacent removed+added into word-level "changed"
  const paired: CompareRow[] = [];
  for (let k = 0; k < rows.length; k++) {
    const cur = rows[k]!;
    const next = rows[k + 1];
    if (cur.kind === "removed" && next?.kind === "added") {
      const words = diffWords(cur.left, next.right);
      paired.push({
        kind: "changed",
        left: cur.left,
        right: next.right,
        leftWords: words.left,
        rightWords: words.right,
      });
      // adjust counts: one change instead of remove+add
      removed--;
      added--;
      k++;
    } else {
      paired.push(cur);
    }
  }

  const identical =
    styleOnly === 0 &&
    added === 0 &&
    removed === 0 &&
    !paired.some((r) => r.kind === "changed");

  return {
    rows: paired,
    summary: {
      paragraphsCompared: Math.max(left.length, right.length),
      textChanges: paired.filter((r) =>
        r.kind === "changed" || r.kind === "added" || r.kind === "removed",
      ).length,
      styleOnlyChanges: styleOnly,
      added,
      removed,
      identical,
    },
  };
}

/** Soft complexity estimate for UI warnings (higher = heavier). */
export function estimateComplexity(left: DocBlock[], right: DocBlock[]): number {
  const chars =
    left.reduce((s, b) => s + b.text.length, 0) +
    right.reduce((s, b) => s + b.text.length, 0);
  return left.length + right.length + Math.floor(chars / 80);
}
