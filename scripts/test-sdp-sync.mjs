/**
 * Smoke test for public/data/sdp.json after sync.
 * Usage: npm run test:sdp
 */
import fs from "node:fs";
import path from "node:path";

const SDP = path.resolve("public/data/sdp.json");
const MIN = 500;
const REQUIRED_CODES = ["010.01", "640"];

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

if (!fs.existsSync(SDP)) fail(`Missing ${SDP} — run npm run sync:sdp`);

const data = JSON.parse(fs.readFileSync(SDP, "utf8"));

if (data.version === "fallback-sample") {
  fail("sdp.json is still fallback-sample");
}
if (data.version !== "ssdp-v4") {
  fail(`Unexpected version: ${data.version}`);
}
if (!Array.isArray(data.entries) || data.entries.length < MIN) {
  fail(`Expected >= ${MIN} entries, got ${data.entries?.length ?? 0}`);
}
if (!data.plans?.length) fail("Missing plans array");
if (!data.sources?.length) fail("Missing sources array");

const codes = new Set(data.entries.map((e) => e.code));
for (const c of REQUIRED_CODES) {
  if (!codes.has(c)) fail(`Missing required code: ${c}`);
}

const mainCount = data.entries.filter((e) => e.planId === "ssdp-main").length;
if (mainCount < 200) fail(`ssdp-main too small: ${mainCount}`);

console.log(
  `OK: ${data.entries.length} entries, version=${data.version}, main=${mainCount}`,
);
