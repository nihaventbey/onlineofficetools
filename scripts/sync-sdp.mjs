/**
 * Download SSDP Excel files (Devlet Arşivleri V.4) and write public/data/sdp.json.
 *
 * Usage: npm run sync:sdp
 * Optional: SDP_EXCEL_PATH=./local.xlsx (single file override)
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const OUT = path.resolve("public/data/sdp.json");
const PAGE_URL =
  "https://www.devletarsivleri.gov.tr/Sayfalar/Sayfa.aspx?h=EC4EE38996FE1DD2D040D483800B793116ED6F1FD94ED1E517B581F5E16F395B&icerik=20";
const BASE = "https://www.devletarsivleri.gov.tr/";

/** @type {{ id: string; label: string; path: string; match?: RegExp }[]} */
const SOURCES = [
  {
    id: "ssdp-main",
    label: "SSDP V.4 (genel)",
    path: "varliklar/goruntuler/haberler/image/SSDP (2024 V.4).xls",
    match: /SSDP.*2024.*V\.4/i,
  },
  {
    id: "belediye-kurumsal",
    label: "Belediye kurumsal (100–599)",
    path: "varliklar/goruntuler/haberler/image/Belediye SSDP.xls",
    match: /Belediye/i,
  },
  {
    id: "yok-kurumsal",
    label: "YÖK kurumsal (100–599)",
    path: "varliklar/goruntuler/haberler/image/YÖK SSDP.xls",
    match: /YÖK|YOK/i,
  },
];

const MIN_ENTRIES = 500;

function encodePath(p) {
  return p
    .split("/")
    .map((seg, i) => (i === 0 ? seg : encodeURIComponent(seg)))
    .join("/");
}

function cellStr(v) {
  if (v == null) return "";
  return String(v).trim();
}

/** @param {string[]} parts */
function normalizeCode(parts) {
  const nums = parts
    .map((p) => cellStr(p))
    .filter(Boolean)
    .map((p) => p.replace(/\s+/g, ""));
  if (!nums.length) return "";
  if (nums.length === 1) return nums[0];
  return `${nums[0]}.${nums.slice(1).join(".")}`;
}

/** @param {string} code */
function parentCode(code) {
  const dot = code.lastIndexOf(".");
  return dot > 0 ? code.slice(0, dot) : undefined;
}

/** @param {string} code @param {string} [note] */
function isSectionOnly(code, note) {
  if (/dosyalamada.*kullanılmaz/i.test(note ?? "")) return true;
  if (/^\d{3}$/.test(code) && (code.endsWith("00") || code === "000" || code.startsWith("6"))) {
    const n = Number(code);
    if (n % 100 === 0 || code === "000") return true;
  }
  return false;
}

/** @param {string} retention */
function formatRetention(retention) {
  const r = cellStr(retention);
  if (!r) return undefined;
  if (/^B$/i.test(r)) return "Sürekli";
  if (/^\d+$/.test(r)) return `${r} yıl`;
  return r;
}

/**
 * Parse SSDP main sheet (cols: kod parts 0-3, name 4, retention 5, grade 6, note 7)
 * @param {unknown[][]} rows
 * @param {string} planId
 */
function parseMainSheet(rows, planId) {
  /** @type {import('./sdp-types.mjs').SdpEntry[]} */
  const entries = [];
  const seen = new Set();

  for (const row of rows) {
    const cells = row.map(cellStr);
    if (cells.length < 5) continue;

    const code = normalizeCode(cells.slice(0, 4));
    const name = cells[4];
    if (!code || !name) continue;
    if (/dosya kodu|genel dosya adı|saklama/i.test(name) && name.length < 30) continue;
    if (/Devlet Arşivleri Başkanlığının/i.test(cells[0])) continue;

    const retention = formatRetention(cells[5]);
    const archiveGrade = cells[6] || undefined;
    const note = cells[7] || undefined;
    const key = `${planId}|${code}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const entry = {
      code,
      name,
      planId,
      sectionOnly: isSectionOnly(code, note),
    };
    if (retention) entry.retention = retention;
    if (archiveGrade) entry.archiveGrade = archiveGrade;
    if (note) entry.note = note;
    const pc = parentCode(code);
    if (pc) entry.parentCode = pc;
    entries.push(entry);
  }
  return entries;
}

/**
 * Parse kurumsal sheets (belediye / yök) — same column layout
 * @param {unknown[][]} rows
 * @param {string} planId
 */
function parseKurumsalSheet(rows, planId) {
  /** @type {import('./sdp-types.mjs').SdpEntry[]} */
  const entries = [];
  const seen = new Set();
  /** @type {string[]} */
  const stack = ["", "", "", ""];

  for (const row of rows) {
    const cells = row.map(cellStr);
    if (cells.length < 5) continue;

    const name = cells[4];
    if (!name) continue;
    if (/Ana Dosya|Ana dosya|BELEDİYE|Standart Dosya Planı/i.test(name) && name.length < 40) {
      if (/Ana [Dd]osya/i.test(cells[0] + cells[4])) continue;
    }
    if (/Başbakanlığın|uygulamaya konulmuş/i.test(cells[0])) continue;
    if (/tamamen çıkartılmış/i.test(name)) continue;

    // Update hierarchical stack from cols 0-3
    for (let level = 0; level < 4; level++) {
      const v = cells[level];
      if (v) {
        stack[level] = v.replace(/\s+/g, "");
        for (let j = level + 1; j < 4; j++) stack[j] = "";
      }
    }

    const parts = stack.filter(Boolean);
    if (!parts.length) continue;

    let code;
    if (planId === "belediye-kurumsal" || planId === "yok-kurumsal") {
      // First segment is 3-digit block (100-599)
      const main = parts[0];
      if (!/^\d{2,3}$/.test(main)) continue;
      code = parts.length === 1 ? main : `${main}.${parts.slice(1).join(".")}`;
    } else {
      code = normalizeCode(parts);
    }

    if (/dosya kodu|saklama süresi/i.test(name)) continue;

    const retention = formatRetention(cells[5]);
    const archiveGrade = cells[6] || undefined;
    const key = `${planId}|${code}|${name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const entry = {
      code,
      name,
      planId,
      sectionOnly: parts.length === 1 && /\(Genel\)|\(genel\)/i.test(name),
    };
    if (retention) entry.retention = retention;
    if (archiveGrade) entry.archiveGrade = archiveGrade;
    const pc = parentCode(code);
    if (pc) entry.parentCode = pc;
    entries.push(entry);
  }
  return entries;
}

/**
 * @param {Buffer} buf
 * @param {string} planId
 */
function parseWorkbook(buf, planId) {
  const wb = XLSX.read(buf, { type: "buffer" });
  const entries = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const parsed =
      planId === "ssdp-main"
        ? parseMainSheet(rows, planId)
        : parseKurumsalSheet(rows, planId);
    entries.push(...parsed);
  }
  return entries;
}

async function findExcelLinksFromPage() {
  try {
    const res = await fetch(PAGE_URL, {
      headers: { "User-Agent": "onlineofficetools-sdp-sync/1.0" },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const hrefs = [
      ...html.matchAll(/href=["']([^"']+\.(?:xlsx|xls)[^"']*)["']/gi),
    ].map((m) => m[1]);
    return hrefs.map((h) => {
      try {
        return new URL(h, PAGE_URL).href;
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

/** @param {string} url */
async function download(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "onlineofficetools-sdp-sync/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/** @param {{ id: string; label: string; path: string }} source */
async function fetchSource(source) {
  const url = BASE + encodePath(source.path);
  console.log(`Downloading ${source.id}: ${url}`);
  const buf = await download(url);
  const entries = parseWorkbook(buf, source.id);
  if (entries.length < 10) {
    throw new Error(`${source.id}: only ${entries.length} entries parsed`);
  }
  return { ...source, url, entries };
}

async function main() {
  if (!XLSX) {
    throw new Error("xlsx module required — run npm install");
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  /** @type {import('./sdp-types.mjs').SdpEntry[]} */
  let allEntries = [];
  /** @type {import('./sdp-types.mjs').SdpSource[]} */
  const sources = [];

  const localPath = process.env.SDP_EXCEL_PATH;
  if (localPath && fs.existsSync(localPath)) {
    const entries = parseWorkbook(fs.readFileSync(localPath), "ssdp-main");
    allEntries = entries;
    sources.push({
      id: "ssdp-main",
      label: "Local Excel",
      url: localPath,
    });
  } else {
    const pageLinks = await findExcelLinksFromPage();
    if (pageLinks.length) {
      console.log(`Found ${pageLinks.length} Excel links on source page`);
    }

    for (const source of SOURCES) {
      try {
        const result = await fetchSource(source);
        allEntries.push(...result.entries);
        sources.push({
          id: result.id,
          label: result.label,
          url: result.url,
        });
        console.log(`  → ${result.entries.length} entries`);
      } catch (err) {
        console.error(`Failed ${source.id}:`, err.message);
        throw err;
      }
    }
  }

  if (allEntries.length < MIN_ENTRIES) {
    throw new Error(
      `Only ${allEntries.length} entries parsed (need >= ${MIN_ENTRIES}). Check Excel sources.`,
    );
  }

  const plans = [
    { id: "ssdp-main", label: "Genel SSDP V.4" },
    { id: "belediye-kurumsal", label: "Belediye kurumsal (100–599)" },
    { id: "yok-kurumsal", label: "YÖK kurumsal (100–599)" },
  ].filter((p) => allEntries.some((e) => e.planId === p.id));

  const payload = {
    version: "ssdp-v4",
    effectiveFrom: "2024-01-02",
    updatedAt: new Date().toISOString(),
    sourcePage: PAGE_URL,
    sources,
    plans,
    entries: allEntries,
  };

  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`Wrote ${allEntries.length} SDP entries → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
