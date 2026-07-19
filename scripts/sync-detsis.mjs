/**
 * Snapshot DETSİS institution list into public/data/detsis.json.
 *
 * Usage: npm run sync:detsis
 *
 * Tries known/public endpoints on detsis.gov.tr. If scrape fails, writes an
 * incomplete snapshot so the UI can still validate 8-digit format and link out.
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("public/data/detsis.json");

/** @typedef {{ id: string; name: string; parentId?: string; kind?: string }} Entry */

/** Prefer existing hierarchical seed if sync fails. */
function loadExistingSeed() {
  try {
    if (fs.existsSync(OUT)) {
      const prev = JSON.parse(fs.readFileSync(OUT, "utf8"));
      if (Array.isArray(prev.entries) && prev.entries.length > 3) {
        return prev.entries;
      }
    }
  } catch {
    /* ignore */
  }
  return [
    { id: "00001000", name: "Cumhurbaşkanlığı", kind: "cumhurbaskanligi" },
    {
      id: "10010000",
      name: "Sanayi ve Teknoloji Bakanlığı",
      kind: "bakanlik",
    },
    {
      id: "20010000",
      name: "Türk Standartları Enstitüsü Başkanlığı",
      parentId: "10010000",
      kind: "bagli",
    },
  ];
}

/** @type {Entry[]} */
const SEED = loadExistingSeed();

/**
 * @param {string} url
 * @returns {Promise<unknown | null>}
 */
async function tryFetchJson(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "onlineofficetools-detsis-sync/1.0",
        Accept: "application/json, text/html, */*",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("json")) return res.json();
    const text = await res.text();
    if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
      return JSON.parse(text);
    }
    return { __html: text };
  } catch {
    return null;
  }
}

/**
 * @param {unknown} raw
 * @returns {Entry[]}
 */
function normalizeEntries(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const o = /** @type {Record<string, unknown>} */ (item);
        const id = String(
          o.id ?? o.Id ?? o.kod ?? o.Kod ?? o.detsisNo ?? o.DETSISNo ?? "",
        ).replace(/\D/g, "");
        const name = String(
          o.name ?? o.Name ?? o.ad ?? o.Ad ?? o.kurumAdi ?? o.KurumAdi ?? "",
        ).trim();
        if (id.length !== 8 || !name) return null;
        const parent = o.parentId ?? o.ParentId ?? o.ustId;
        const kind = o.kind ?? o.Kind ?? o.tip;
        /** @type {Entry} */
        const entry = { id, name };
        if (parent != null && String(parent)) entry.parentId = String(parent).replace(/\D/g, "");
        if (kind != null && String(kind)) entry.kind = String(kind);
        return entry;
      })
      .filter(Boolean);
  }
  if (typeof raw === "object") {
    const o = /** @type {Record<string, unknown>} */ (raw);
    for (const key of [
      "data",
      "Data",
      "items",
      "Items",
      "results",
      "Results",
      "list",
    ]) {
      if (o[key]) {
        const nested = normalizeEntries(o[key]);
        if (nested.length) return nested;
      }
    }
  }
  return [];
}

/**
 * @param {string} html
 * @returns {Entry[]}
 */
function scrapeHtml(html) {
  const entries = [];
  const seen = new Set();
  const re =
    /(\d{8})[^<]{0,40}?(?:<\/t[dh]>|<[^>]+>){0,4}([^<]{5,120})/gi;
  let m;
  while ((m = re.exec(html))) {
    const id = m[1];
    const name = m[2].replace(/\s+/g, " ").trim();
    if (seen.has(id) || name.length < 4) continue;
    if (/script|function|var |http/i.test(name)) continue;
    seen.add(id);
    entries.push({ id, name });
    if (entries.length > 5000) break;
  }
  return entries;
}

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  const candidates = [
    process.env.DETSIS_JSON_URL,
    "https://www.detsis.gov.tr/",
    "https://www.kaysis.gov.tr/",
  ].filter(Boolean);

  let entries = [];
  let source = "none";
  let incomplete = true;

  for (const url of candidates) {
    console.log("Trying", url);
    const raw = await tryFetchJson(url);
    if (!raw) continue;
    if (typeof raw === "object" && raw !== null && "__html" in raw) {
      entries = scrapeHtml(
        String(/** @type {{ __html: string }} */ (raw).__html),
      );
    } else {
      entries = normalizeEntries(raw);
    }
    if (entries.length > 5) {
      source = url;
      incomplete = false;
      break;
    }
  }

  if (entries.length <= 5) {
    console.warn(
      "DETSİS snapshot incomplete — format validation still works. Set DETSIS_JSON_URL if you have an export.",
    );
    entries = SEED;
    source = "https://www.detsis.gov.tr/";
    incomplete = true;
  }

  const payload = {
    version: incomplete ? "incomplete" : "snapshot",
    updatedAt: new Date().toISOString(),
    source,
    incomplete,
    entries,
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(
    `Wrote ${entries.length} DETSİS entries → ${OUT} (incomplete=${incomplete})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
