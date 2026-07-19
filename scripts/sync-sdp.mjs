/**
 * Download SSDP Excel (Devlet Arşivleri V.4) and write public/data/sdp.json.
 *
 * Usage: npm run sync:sdp
 * Optional: SDP_EXCEL_URL=... or SDP_EXCEL_PATH=./local.xlsx
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let XLSX = null;
try {
  XLSX = require("xlsx");
} catch {
  console.warn("xlsx not installed — Excel parse disabled (fallback JSON only).");
}

const OUT = path.resolve("public/data/sdp.json");
const PAGE_URL =
  "https://www.devletarsivleri.gov.tr/Sayfalar/Sayfa.aspx?h=EC4EE38996FE1DD2D040D483800B793116ED6F1FD94ED1E517B581F5E16F395B&icerik=20";

const CANDIDATE_URLS = [process.env.SDP_EXCEL_URL].filter(Boolean);

const FALLBACK = [
  { code: "000", name: "GENEL İŞLER", retention: "—" },
  { code: "010", name: "Teşkilat, Görev ve Yetkiler", retention: "Sürekli" },
  { code: "020", name: "Yönetim ve İdare", retention: "—" },
  { code: "030", name: "İnsan Kaynakları", retention: "—" },
  { code: "040", name: "Mali İşler", retention: "—" },
  { code: "050", name: "Bilgi İşlem", retention: "—" },
  { code: "060", name: "Basın ve Halkla İlişkiler", retention: "—" },
  { code: "070", name: "İç Denetim", retention: "—" },
  { code: "080", name: "Strateji Geliştirme", retention: "—" },
  { code: "090", name: "Diğer Genel İşler", retention: "—" },
  { code: "600", name: "ARAŞTIRMA VE PLANLAMA İŞLERİ", retention: "—" },
  { code: "610", name: "Araştırma, Geliştirme", retention: "—" },
  { code: "620", name: "Planlama", retention: "—" },
  { code: "630", name: "İstatistik", retention: "—" },
  { code: "640", name: "Hukuk İşleri", retention: "—" },
  { code: "650", name: "Dış İlişkiler", retention: "—" },
  { code: "700", name: "EĞİTİM VE ÖĞRETİM", retention: "—" },
  { code: "710", name: "Öğrenci İşleri", retention: "—" },
  { code: "720", name: "Öğretim", retention: "—" },
  { code: "800", name: "SAĞLIK", retention: "—" },
  { code: "900", name: "DİĞER İŞLER", retention: "—" },
];

async function findExcelUrlFromPage() {
  try {
    const res = await fetch(PAGE_URL, {
      headers: { "User-Agent": "onlineofficetools-sdp-sync/1.0" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const matches = [
      ...html.matchAll(/href="([^"]+\.(?:xlsx|xls)[^"]*)"/gi),
      ...html.matchAll(/href='([^']+\.(?:xlsx|xls)[^']*)'/gi),
    ];
    for (const m of matches) {
      let href = m[1];
      if (href.includes("SSDP") || href.includes("sdp") || href.includes("Dosya") || /\.xlsx?/i.test(href)) {
        try {
          href = new URL(href, PAGE_URL).href;
        } catch {
          continue;
        }
        return href;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function parseWorkbook(buf) {
  if (!XLSX) return [];
  const wb = XLSX.read(buf, { type: "buffer" });
  const entries = [];
  const seen = new Set();

  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });

    for (const row of rows) {
      const cells = row.map((c) => String(c ?? "").trim());
      if (cells.length < 2) continue;
      let code = "";
      let title = "";
      let retention = "";
      for (let i = 0; i < Math.min(cells.length, 6); i++) {
        const c = cells[i];
        if (!code && /^\d{2,4}([.\-]\d{1,4})*$/.test(c)) {
          code = c;
          title = cells.slice(i + 1).find((x) => x.length > 2) ?? "";
          retention =
            cells.slice(i + 2).find((x) => /yıl|sürekli|gün|ay/i.test(x)) ?? "";
          break;
        }
      }
      if (!code || !title) continue;
      if (/kod|açıklama|dosya plan/i.test(title) && title.length < 20) continue;
      const key = `${code}|${title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = { code, name: title };
      if (retention) entry.retention = retention;
      entries.push(entry);
    }
  }
  return entries;
}

async function download(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "onlineofficetools-sdp-sync/1.0" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  let entries = [];
  let version = "fallback-sample";
  let source = "bundled-sample";

  const localPath = process.env.SDP_EXCEL_PATH;
  if (localPath && fs.existsSync(localPath)) {
    entries = parseWorkbook(fs.readFileSync(localPath));
    version = "local-excel";
    source = localPath;
  } else {
    const pageUrl = await findExcelUrlFromPage();
    const urls = [...CANDIDATE_URLS, ...(pageUrl ? [pageUrl] : [])];
    for (const url of urls) {
      console.log("Trying", url);
      const buf = await download(url);
      if (!buf) continue;
      const parsed = parseWorkbook(buf);
      if (parsed.length > 20) {
        entries = parsed;
        version = "ssdp-v4";
        source = url;
        break;
      }
    }
  }

  if (entries.length < 10) {
    console.warn(
      "Could not parse live SSDP Excel; writing fallback sample. Set SDP_EXCEL_PATH or SDP_EXCEL_URL.",
    );
    entries = FALLBACK;
    version = "fallback-sample";
    source = PAGE_URL;
  }

  const payload = {
    version,
    updatedAt: new Date().toISOString(),
    source,
    entries,
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`Wrote ${entries.length} SDP entries → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
