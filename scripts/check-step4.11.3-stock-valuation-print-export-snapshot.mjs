import fs from 'node:fs';

const requiredFiles = [
  'src/services/stock-valuation-service.js',
  'src/routes/stock-valuation-routes.js',
  'views/pages/stock-valuation.hbs',
  'public/js/stock-valuation.js',
  'public/css/stock-valuation.css',
  'docs/reference/step4.11.3-stock-valuation-print-export-manager-snapshot-qa.md'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8').replace(/^\uFEFF/, ''));
const versionParts = String(pkg.version || '').split('.').map((part) => Number(part));
const versionNumber = (versionParts[0] * 10000) + (versionParts[1] * 100) + versionParts[2];
const minimumVersionNumber = 434;
if (!Number.isFinite(versionNumber) || versionNumber < minimumVersionNumber) {
  throw new Error(`Expected package version >= 0.4.34, got ${pkg.version}`);
}

const service = fs.readFileSync('src/services/stock-valuation-service.js', 'utf8');
const routes = fs.readFileSync('src/routes/stock-valuation-routes.js', 'utf8');
const view = fs.readFileSync('views/pages/stock-valuation.hbs', 'utf8');
const client = fs.readFileSync('public/js/stock-valuation.js', 'utf8');
const css = fs.readFileSync('public/css/stock-valuation.css', 'utf8');

const mustContain = [
  [service, 'getStockValuationManagerSnapshot'],
  [service, 'buildManagerSnapshotCards'],
  [service, 'buildPrintMetadata'],
  [routes, "router.get('/api/stock/valuation/manager-snapshot'"],
  [view, 'data-valuation-tab="manager-print"'],
  [view, 'data-manager-snapshot-cards'],
  [view, 'data-manager-location-table'],
  [view, 'data-manager-risk-table'],
  [client, '/api/stock/valuation/manager-snapshot'],
  [client, 'renderManagerSnapshot'],
  [client, "state.activeTab === 'manager-print'"],
  [css, 'stock-valuation-manager-cards'],
  [css, '@media print']
];

for (const [content, needle] of mustContain) {
  if (!content.includes(needle)) throw new Error(`Missing expected marker: ${needle}`);
}

const forbiddenRoutePattern = /router\.(post|put|patch|delete)\s*\(\s*['"]\/api\/stock\/valuation/i;
if (forbiddenRoutePattern.test(routes)) throw new Error('Forbidden write valuation route detected.');

const forbiddenServicePatterns = [/\.create\s*\(/, /\.update\s*\(/, /\.delete\s*\(/, /\.upsert\s*\(/, /\$executeRawUnsafe\s*\(/];
for (const pattern of forbiddenServicePatterns) {
  if (pattern.test(service)) throw new Error(`Forbidden write pattern detected in stock valuation service: ${pattern}`);
}

console.log('OK: Step 4.11.3 stock valuation print/export manager snapshot checks passed.');
