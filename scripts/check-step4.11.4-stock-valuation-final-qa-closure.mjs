import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8').replace(/^\uFEFF/, '');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function mustExist(relativePath) {
  if (!exists(relativePath)) {
    throw new Error(`Missing expected file: ${relativePath}`);
  }
}

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

function assertNotMatches(text, pattern, label) {
  if (pattern.test(text)) {
    throw new Error(`Forbidden ${label}: ${pattern}`);
  }
}

function versionAtLeast(actual, expected) {
  const a = String(actual || '').split('.').map(Number);
  const e = String(expected || '').split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    const av = Number.isFinite(a[i]) ? a[i] : 0;
    const ev = Number.isFinite(e[i]) ? e[i] : 0;
    if (av > ev) return true;
    if (av < ev) return false;
  }
  return true;
}

const expectedFiles = [
  'src/services/stock-valuation-service.js',
  'src/routes/stock-valuation-routes.js',
  'views/pages/stock-valuation.hbs',
  'public/js/stock-valuation.js',
  'public/css/stock-valuation.css',
  'scripts/check-step4.11-stock-valuation.mjs',
  'scripts/check-step4.11.1-stock-valuation-polish.mjs',
  'scripts/check-step4.11.2-stock-valuation-drilldown.mjs',
  'scripts/check-step4.11.3-stock-valuation-print-export-snapshot.mjs',
  'scripts/check-step4.11.4-stock-valuation-final-qa-closure.mjs',
  'scripts/smoke-step4.11-stock-valuation.mjs',
  'scripts/smoke-step4.11.1-stock-valuation-polish.mjs',
  'scripts/smoke-step4.11.2-stock-valuation-drilldown.mjs',
  'scripts/smoke-step4.11.3-stock-valuation-print-export-snapshot.mjs',
  'scripts/smoke-step4.11.4-stock-valuation-final-qa-closure.mjs',
  'docs/reference/step4.11-stock-valuation-inventory-cost-view-foundation.md',
  'docs/reference/step4.11.1-stock-valuation-ui-polish-cost-confidence-manager-filters.md',
  'docs/reference/step4.11.2-stock-valuation-drilldown-cost-source-inspector.md',
  'docs/reference/step4.11.3-stock-valuation-print-export-manager-snapshot-qa.md',
  'docs/reference/step4.11.4-stock-valuation-final-qa-clean-module-closure.md'
];

for (const file of expectedFiles) {
  mustExist(file);
}

const pkg = JSON.parse(read('package.json'));
if (!versionAtLeast(pkg.version, '0.4.35')) {
  throw new Error(`Expected package version >= 0.4.35, got ${pkg.version}`);
}

const service = read('src/services/stock-valuation-service.js');
const routes = read('src/routes/stock-valuation-routes.js');
const page = read('views/pages/stock-valuation.hbs');
const client = read('public/js/stock-valuation.js');
const css = read('public/css/stock-valuation.css');

for (const endpoint of [
  '/api/stock/valuation/options',
  '/api/stock/valuation/summary',
  '/api/stock/valuation/balance',
  '/api/stock/valuation/movements-cost',
  '/api/stock/valuation/snapshot',
  '/api/stock/valuation/item-ledger',
  '/api/stock/valuation/cost-source',
  '/api/stock/valuation/manager-snapshot'
]) {
  assertIncludes(routes, endpoint, `valuation endpoint ${endpoint}`);
}

assertIncludes(page, 'stock-valuation', 'stock valuation page marker');
assertIncludes(client, 'manager-snapshot', 'manager snapshot client support');
assertIncludes(client, 'cost-source', 'cost source client support');
assertIncludes(css, '@media print', 'print stylesheet');
assertIncludes(service, 'manager', 'manager snapshot/service support');
assertIncludes(service, 'confidence', 'cost confidence support');

// Read-only route guard: valuation routes must remain GET-only.
assertNotMatches(routes, /\brouter\.(post|put|patch|delete)\s*\(/i, 'mutating valuation route method');
assertNotMatches(routes, /\bapp\.(post|put|patch|delete)\s*\(/i, 'mutating valuation app route method');

// Service guard: block real mutating Prisma writes and known stock write actions.
// Do not block harmless words such as "correction" inside explanatory read-only code.
assertNotMatches(
  service,
  /\bprisma\.[A-Za-z0-9_]+\.(create|update|upsert|delete|deleteMany|updateMany)\s*\(/i,
  'mutating Prisma operation in valuation service'
);

assertNotMatches(
  service,
  /\b(postStock|postDocument|postStockDocument|reverseStock|reverseStockDocument|createStockCorrection|applyStockCorrection|unlockPosted|unlockDocument)\s*\(/i,
  'known stock write action in valuation service'
);

assertNotMatches(
  `${routes}\n${service}`,
  /\b(stockJournal|stockMovementJournal)\s*\.\s*(create|update|upsert|delete|deleteMany|updateMany)\s*\(/i,
  'stock journal mutation'
);

console.log('OK: Step 4.11.4 stock valuation final QA / clean module closure checks passed.');
