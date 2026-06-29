import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'src/services/stock-reports-service.js',
  'src/routes/stock-reports-routes.js',
  'views/pages/stock-reports.hbs',
  'public/js/stock-reports.js',
  'public/css/stock-reports.css',
  'docs/reference/step4.10.3-stock-reports-print-export-manager-snapshot-qa.md'
];

const requiredMarkers = new Map([
  ['views/pages/stock-reports.hbs', [
    'data-report-tab="manager-snapshot"',
    'data-tab-panel="manager-snapshot"',
    'data-manager-cards',
    'data-manager-actions',
    'data-manager-locations',
    'data-manager-documents',
    'data-manager-safety'
  ]],
  ['public/js/stock-reports.js', [
    'renderManagerSnapshot',
    'renderManagerCards',
    'renderManagerActions',
    'updatePrintSummary',
    '/api/stock/reports/manager-snapshot',
    'data-manager-locations',
    'beforeprint',
    'managerTopLocations'
  ]],
  ['public/css/stock-reports.css', [
    '.stock-report-manager-panel',
    '.stock-report-print-meta',
    '.stock-report-manager-cards',
    '.stock-report-manager-layout',
    '.stock-report-manager-action',
    '@media print',
    'data-print-period'
  ]],
  ['src/services/stock-reports-service.js', [
    'getStockReportsManagerSnapshot',
    'buildManagerRisk',
    'buildManagerCards',
    'buildManagerActions',
    'aggregateManagerLocations',
    'buildManagerPrintMeta',
    'recentDocuments'
  ]],
  ['src/routes/stock-reports-routes.js', [
    "router.get('/api/stock/reports/manager-snapshot'",
    'getStockReportsManagerSnapshot',
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
  /journal\s*edit/i,
  /reversal\s*logic\s*changed/i
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

const routesPath = path.join(root, 'src/routes/stock-reports-routes.js');
const routes = fs.existsSync(routesPath) ? fs.readFileSync(routesPath, 'utf8') : '';
const getCount = (routes.match(/router\.get\s*\(/g) || []).length;
const writeCount = (routes.match(/router\.(post|put|patch|delete)\s*\(/g) || []).length;
if (getCount < 8 || writeCount !== 0) {
  console.error(`ROUTE_SHAPE_INVALID get=${getCount} write=${writeCount}`);
  failed = true;
}

if (failed) process.exit(1);
console.log('OK: Step 4.10.3 stock reports print/export manager snapshot checks passed.');
