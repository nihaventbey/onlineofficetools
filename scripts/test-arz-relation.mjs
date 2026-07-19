/**
 * Relation / closing tests for arzRicaRelation.ts
 *
 * Prefer: node --experimental-strip-types scripts/test-arz-relation.mjs
 * Falls back to: npx --yes tsx scripts/test-arz-relation.mjs
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const self = fileURLToPath(import.meta.url);
const root = join(dirname(self), "..");

function byId(catalog, id) {
  const e = catalog.find((x) => x.id === id);
  if (!e) throw new Error(`Missing catalog entry ${id}`);
  return e;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function assertEq(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function loadLib() {
  try {
    return await import("../src/lib/ebys/arzRicaRelation.ts");
  } catch (err) {
    if (process.env.__ARZ_REL_TSX === "1") throw err;
    console.warn(
      "strip-types import failed; falling back to npx tsx:",
      err instanceof Error ? err.message : err,
    );
    const r = spawnSync("npx", ["--yes", "tsx", self], {
      stdio: "inherit",
      env: { ...process.env, __ARZ_REL_TSX: "1" },
      cwd: root,
    });
    process.exit(r.status ?? 1);
  }
}

const { resolveRelation, findForbiddenPhrases } = await loadLib();

const detsis = JSON.parse(
  readFileSync(join(root, "public/data/detsis.json"), "utf8"),
);
const catalog = Array.isArray(detsis) ? detsis : (detsis.entries ?? []);

const ministry = byId(catalog, "10010000"); // Sanayi ve Teknoloji Bakanlığı
const tse = byId(catalog, "20010000"); // TSE (bagli)
const peerA = byId(catalog, "10010001");
const peerB = byId(catalog, "10010002");
const cb = byId(catalog, "00001000");
const childUnit = peerA; // child of ministry

let passed = 0;

function run(name, fn) {
  fn();
  console.log(`PASS: ${name}`);
  passed += 1;
}

run("ministry -> bagli TSE = lower, Rica ederim.", () => {
  const r = resolveRelation({ sender: ministry, recipients: [tse] }, catalog);
  assertEq(r.relation, "lower", "relation");
  assertEq(r.closing, "Rica ederim.", "closing");
});

run("peer units same parentId = peer, Arz ederim.", () => {
  const r = resolveRelation({ sender: peerA, recipients: [peerB] }, catalog);
  assertEq(r.relation, "peer", "relation");
  assertEq(r.closing, "Arz ederim.", "closing");
});

run("CB -> ministry = lower", () => {
  const r = resolveRelation({ sender: cb, recipients: [ministry] }, catalog);
  assertEq(r.relation, "lower", "relation");
  assertEq(r.closing, "Rica ederim.", "closing");
});

run("child unit -> parent ministry = upper", () => {
  const r = resolveRelation(
    { sender: childUnit, recipients: [ministry] },
    catalog,
  );
  assertEq(r.relation, "upper", "relation");
  assertEq(r.closing, "Arz ederim.", "closing");
});

run("ministry -> [bagli, CB] = mixed", () => {
  const r = resolveRelation(
    { sender: ministry, recipients: [tse, cb] },
    catalog,
  );
  assertEq(r.relation, "mixed", "relation");
  assertEq(r.closing, "Arz ve rica ederim.", "closing");
});

run("unknown A -> unknown B = uncertain, Arz ederim.", () => {
  const a = { id: "99990001", name: "Unknown Org A" };
  const b = { id: "99990002", name: "Unknown Org B" };
  const r = resolveRelation({ sender: a, recipients: [b] }, catalog);
  assertEq(r.relation, "uncertain", "relation");
  assertEq(r.closing, "Arz ederim.", "closing");
});

run('findForbiddenPhrases("Gereğini rica ederim.") length 0', () => {
  assertEq(findForbiddenPhrases("Gereğini rica ederim.").length, 0, "length");
});

run('findForbiddenPhrases("Bilgilerinizi rica ederim.") length 1', () => {
  assertEq(
    findForbiddenPhrases("Bilgilerinizi rica ederim.").length,
    1,
    "length",
  );
});

console.log(`\nAll ${passed} tests passed.`);
