import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'src/services/stock-reports-service.js',
  'src/routes/stock-reports-routes.js',
  'views/pages/stock-reports.hbs',
  'public/js/stock-reports.js',
  'public/css/stock-reports.css',
  'docs/reference/step4.10.1-stock-reports-ui-polish-report-tabs-operator-filters.md'
];

const requiredMarkers = new Map([
  ['views/pages/stock-reports.hbs', [
    'data-report-tab="overview"',
    'data-report-tab="balance"',
    'data-report-tab="movements"',
    'data-report-tab="risks"',
    'data-filter-operator',
    'data-period-preset="30"',
    'data-filter-search',
    'data-filter-report-mode'
  ]],
  ['public/js/stock-reports.js', [
    'setActiveTab',
    'setPeriodPreset',
    'data-filter-operator',
    'filterBalanceRows',
    'filterMovementRows',
    'escapeHtml',
    'operatorLabel'
  ]],
  ['public/css/stock-reports.css', [
    '.stock-report-tabs',
    '.stock-report-operator-strip',
    '.stock-report-summary-grid',
    '.stock-report-period-buttons',
    '.stock-report-table-counter'
  ]],
  ['src/services/stock-reports-service.js', [
    'operatorId',
    'operatorLabel',
    'buildOperatorOptions',
    'movement.userCol && filters.operatorId'
  ]],
  ['src/routes/stock-reports-routes.js', [
    "router.get('/stock-reports'",
    "router.get('/api/stock/reports/options'",
    "router.get('/api/stock/reports/summary'",
    "router.get('/api/stock/reports/balance'",
    "router.get('/api/stock/reports/movements'",
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
  /stock\s*journal\s*delete/i
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

if (failed) process.exit(1);
console.log('OK: Step 4.10.1 stock reports UI polish checks passed.');
