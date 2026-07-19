import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'));
}

const tr = loadJson('src/dictionaries/tr.json');
const en = loadJson('src/dictionaries/en.json');
const detsis = loadJson('public/data/detsis.json');

if (!('senderLabel' in (tr.tools?.arzRica ?? {}))) {
  console.error('FAIL: senderLabel missing in tr.json tools.arzRica');
  process.exit(1);
}
if (!('senderLabel' in (en.tools?.arzRica ?? {}))) {
  console.error('FAIL: senderLabel missing in en.json tools.arzRica');
  process.exit(1);
}

const entries = Array.isArray(detsis) ? detsis : (detsis.entries ?? detsis.data ?? Object.values(detsis));
const list = Array.isArray(entries) ? entries : [];
const withParent = list.filter((e) => e && typeof e === 'object' && 'parentId' in e);
if (withParent.length === 0) {
  console.error('FAIL: public/data/detsis.json has no entries with parentId');
  process.exit(1);
}

console.log('ok senderLabel tr+en');
console.log(`ok detsis parentId (${withParent.length}/${list.length})`);
