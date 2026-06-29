import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'src/services/stock-reports-service.js',
  'src/routes/stock-reports-routes.js',
  'views/pages/stock-reports.hbs',
  'public/js/stock-reports.js',
  'public/css/stock-reports.css',
  'docs/reference/step4.10.2-stock-reports-drilldown-item-ledger-location-inspector.md'
];

const requiredMarkers = new Map([
  ['views/pages/stock-reports.hbs', [
    'data-report-tab="item-ledger"',
    'data-report-tab="location-inspector"',
    'data-stock-report-ledger',
    'data-stock-report-location-items',
    'data-stock-report-location-movements',
    'data-ledger-summary',
    'data-location-summary'
  ]],
  ['public/js/stock-reports.js', [
    'loadItemLedger',
    'loadLocationInspector',
    '/api/stock/reports/item-ledger',
    '/api/stock/reports/location-movements',
    'data-ledger-item',
    'data-location-inspect',
    'runningBalance',
    'sourceDocumentCell'
  ]],
  ['public/css/stock-reports.css', [
    '.stock-report-drilldown-summary',
    '.stock-report-inspector-grid',
    '.stock-report-mini-action',
    '.stock-report-source-link',
    '.stock-report-ledger-table'
  ]],
  ['src/services/stock-reports-service.js', [
    'getStockReportsItemLedger',
    'getStockReportsLocationMovements',
    'withRunningBalance',
    'summarizeLocationMovements',
    'documentHref'
  ]],
  ['src/routes/stock-reports-routes.js', [
    "router.get('/api/stock/reports/item-ledger'",
    "router.get('/api/stock/reports/location-movements'",
    'getStockReportsItemLedger',
    'getStockReportsLocationMovements',
    'Cache-Control'
  ]]
]);

const forbiddenWritePatterns = [
  /router\.(post|put|patch|delete)\s*\(/,
  /\$executeRawUnsafe\s*\(/,
  /\.create\s*\(/,
  /\.update\s*\(/,
  /\.delete\s*\(/,
  /\.upsert\s*\(/,
  /posted\s*=\s*false/i,
  /stock\s*journal\s*delete/i,
  /journal\s*edit/i
];

let failed = false;

for (const relative of requiredFiles) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) {
    console.error(`MISSING ${relative}`);
    failed = true;
    continue;
  }
  const content = fs.readFileSync(full, 'utf8');
  const markers = requiredMarkers.get(relative) || [];
  for (const marker of markers) {
    if (!content.includes(marker)) {
      console.error(`MISSING_MARKER ${relative} :: ${marker}`);
      failed = true;
    }
  }
  if (['src/routes/stock-reports-routes.js', 'src/services/stock-reports-service.js'].includes(relative)) {
    for (const pattern of forbiddenWritePatterns) {
      if (pattern.test(content)) {
        console.error(`FORBIDDEN_WRITE_PATTERN ${relative} :: ${pattern}`);
        failed = true;
      }
    }
  }
}

const routes = fs.readFileSync(path.join(root, 'src/routes/stock-reports-routes.js'), 'utf8');
const getCount = (routes.match(/router\.get\s*\(/g) || []).length;
const writeCount = (routes.match(/router\.(post|put|patch|delete)\s*\(/g) || []).length;
if (getCount < 7 || writeCount !== 0) {
  console.error(`ROUTE_SHAPE_INVALID get=${getCount} write=${writeCount}`);
  failed = true;
}

if (failed) process.exit(1);
console.log('OK: Step 4.10.2 stock reports drilldown checks passed.');
