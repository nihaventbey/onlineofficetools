const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
]);

/** Strip disallowed tags/attrs; keep a Belgenet-friendly subset. */
export function sanitizeBelgenetHtml(html: string): string {
  if (typeof DOMParser === "undefined") {
    return sanitizeBelgenetHtmlServer(html);
  }
  const doc = new DOMParser().parseFromString(
    `<div id="root">${html}</div>`,
    "text/html",
  );
  const root = doc.getElementById("root");
  if (!root) return "";
  walk(root);
  return root.innerHTML.trim();
}

function walk(node: Node) {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        // Unwrap: keep children, drop the element
        while (el.firstChild) {
          node.insertBefore(el.firstChild, el);
        }
        node.removeChild(el);
        continue;
      }
      // Drop all attributes (style, class, onclick, …)
      while (el.attributes.length) {
        el.removeAttribute(el.attributes[0].name);
      }
      walk(el);
    } else if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
    }
  }
}

/** Regex fallback for Node (sync scripts / SSR). */
export function sanitizeBelgenetHtmlServer(html: string): string {
  let out = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, "");
  // Remove attributes from remaining tags
  out = out.replace(/<([a-z0-9]+)(\s[^>]*)?>/gi, (_m, tag: string) => {
    const t = tag.toLowerCase();
    if (t === "br") return "<br>";
    if (!ALLOWED_TAGS.has(t)) return "";
    return `<${t}>`;
  });
  out = out.replace(/<\/([a-z0-9]+)>/gi, (_m, tag: string) => {
    const t = tag.toLowerCase();
    if (t === "br") return "";
    if (!ALLOWED_TAGS.has(t)) return "";
    return `</${t}>`;
  });
  return out.trim();
}

/** Wrap plain text as paragraphs for Belgenet paste. */
export function plainTextToBelgenetHtml(text: string): string {
  const paras = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`);
  return paras.join("") || "<p></p>";
}

export function belgenetHtmlToPlain(html: string): string {
  const cleaned = sanitizeBelgenetHtml(html);
  return cleaned
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
