import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'src/services/stock-reports-service.js',
  'src/routes/stock-reports-routes.js',
  'views/pages/stock-reports.hbs',
  'public/js/stock-reports.js',
  'public/css/stock-reports.css',
  'docs/reference/step4.10-stock-reports-inventory-analytics-foundation.md',
  'docs/reference/step4.10.1-stock-reports-ui-polish-report-tabs-operator-filters.md',
  'docs/reference/step4.10.2-stock-reports-drilldown-item-ledger-location-inspector.md',
  'docs/reference/step4.10.3-stock-reports-print-export-manager-snapshot-qa.md',
  'docs/reference/step4.10.4-stock-reports-final-qa-clean-module-closure.md',
  'scripts/check-step4.10-stock-reports.mjs',
  'scripts/check-step4.10.1-stock-reports-polish.mjs',
  'scripts/check-step4.10.2-stock-reports-drilldown.mjs',
  'scripts/check-step4.10.3-stock-reports-print-export-snapshot.mjs',
  'scripts/check-step4.10.4-stock-reports-final-qa-closure.mjs',
  'scripts/smoke-step4.10-stock-reports.mjs',
  'scripts/smoke-step4.10.1-stock-reports-polish.mjs',
  'scripts/smoke-step4.10.2-stock-reports-drilldown.mjs',
  'scripts/smoke-step4.10.3-stock-reports-print-export-snapshot.mjs',
  'scripts/smoke-step4.10.4-stock-reports-final-qa-closure.mjs'
];

const requiredMarkers = new Map([
  ['src/routes/stock-reports-routes.js', [
    "router.get('/stock-reports'",
    "router.get('/api/stock/reports/options'",
    "router.get('/api/stock/reports/summary'",
    "router.get('/api/stock/reports/balance'",
    "router.get('/api/stock/reports/movements'",
    "router.get('/api/stock/reports/item-ledger'",
    "router.get('/api/stock/reports/location-movements'",
    "router.get('/api/stock/reports/manager-snapshot'",
    'Cache-Control',
    'no-store'
  ]],
  ['src/services/stock-reports-service.js', [
    'getStockReportsOptions',
    'getStockReportsSummary',
    'getStockReportsBalance',
    'getStockReportsMovements',
    'getStockReportsItemLedger',
    'getStockReportsLocationMovements',
    'getStockReportsManagerSnapshot',
    'runningBalance',
    'recentDocuments',
    'buildManagerRisk',
    'buildManagerPrintMeta'
  ]],
  ['views/pages/stock-reports.hbs', [
    'data-stock-reports-root',
    'data-report-tab="overview"',
    'data-report-tab="balance"',
    'data-report-tab="movements"',
    'data-report-tab="risks"',
    'data-report-tab="item-ledger"',
    'data-report-tab="location-inspector"',
    'data-report-tab="manager-snapshot"',
    'data-manager-cards',
    'data-manager-cards'
  ]],
  ['public/js/stock-reports.js', [
    '/api/stock/reports/options',
    '/api/stock/reports/summary',
    '/api/stock/reports/balance',
    '/api/stock/reports/movements',
    '/api/stock/reports/item-ledger',
    '/api/stock/reports/location-movements',
    '/api/stock/reports/manager-snapshot',
    'renderItemLedger',
    'renderLocationInspector',
    'renderManagerSnapshot',
    'downloadCsv',
    'beforeprint',
    'updatePrintSummary'
  ]],
  ['public/css/stock-reports.css', [
    '.stock-report-tabs',
    '.stock-report-kpi-grid',
    '.stock-report-manager-panel',
    '.stock-report-print-meta',
    'data-print-period',
    '@media print'
  ]],
  ['docs/reference/step4.10.4-stock-reports-final-qa-clean-module-closure.md', [
    'Stock Reports block is module-closed',
    'Read-only safety contract',
    'No POST/PUT/PATCH/DELETE',
    'Final QA commands'
  ]]
]);

const forbiddenRoutePatterns = [
  /router\.(post|put|patch|delete)\s*\(/,
  /app\.(post|put|patch|delete)\s*\(\s*['"]\/api\/stock\/reports/i
];

const forbiddenServicePatterns = [
  /\$executeRawUnsafe\s*\(/,
  /\bprisma\.[a-zA-Z0-9_]+\.(create|update|delete|upsert|createMany|updateMany|deleteMany)\s*\(/,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+[a-zA-Z0-9_".]+\s+SET\b/i,
  /\bDELETE\s+FROM\b/i,
  /posted\s*=\s*false/i,
  /stock\s*journal\s*delete/i,
  /journal\s*edit/i
];

let failed = false;

function read(relative) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) {
    console.error(`MISSING ${relative}`);
    failed = true;
    return '';
  }
  return fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '');
}

for (const relative of requiredFiles) {
  const content = read(relative);
  if (!content) continue;
  for (const marker of requiredMarkers.get(relative) || []) {
    if (!content.includes(marker)) {
      console.error(`MISSING_MARKER ${relative} :: ${marker}`);
      failed = true;
    }
  }
}

const routes = read('src/routes/stock-reports-routes.js');
const routeGetCount = (routes.match(/router\.get\s*\(/g) || []).length;
const routeWriteCount = (routes.match(/router\.(post|put|patch|delete)\s*\(/g) || []).length;
if (routeGetCount < 8 || routeWriteCount !== 0) {
  console.error(`ROUTE_SHAPE_INVALID get=${routeGetCount} write=${routeWriteCount}`);
  failed = true;
}
for (const pattern of forbiddenRoutePatterns) {
  if (pattern.test(routes)) {
    console.error(`FORBIDDEN_ROUTE_PATTERN ${pattern}`);
    failed = true;
  }
}

const service = read('src/services/stock-reports-service.js');
for (const pattern of forbiddenServicePatterns) {
  if (pattern.test(service)) {
    console.error(`FORBIDDEN_SERVICE_WRITE_PATTERN ${pattern}`);
    failed = true;
  }
}

const packageText = read('package.json');
if (packageText) {
  const pkg = JSON.parse(packageText);
  if (pkg.version !== '0.4.30') {
    console.error(`PACKAGE_VERSION_INVALID ${pkg.version}`);
    failed = true;
  }
}

const lockPath = path.join(root, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8').replace(/^\uFEFF/, ''));
  if (lock.version !== '0.4.30') {
    console.error(`PACKAGE_LOCK_VERSION_INVALID ${lock.version}`);
    failed = true;
  }
  if (lock.packages && lock.packages[''] && lock.packages[''].version !== '0.4.30') {
    console.error(`PACKAGE_LOCK_ROOT_VERSION_INVALID ${lock.packages[''].version}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('OK: Step 4.10.4 stock reports final QA / clean module closure checks passed.');
