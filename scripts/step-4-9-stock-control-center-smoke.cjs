/* AutoGrand ERP V2 - Step 4.9 Stock Control Center smoke check */
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function read(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) throw new Error(`Missing file: ${rel}`);
  return fs.readFileSync(abs, 'utf8');
}

function requireIncludes(rel, snippets, label) {
  const text = read(rel);
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  if (missing.length) {
    throw new Error(`${label} missing in ${rel}: ${missing.join(', ')}`);
  }
  console.log(`OK: ${label}`);
}

function ensureNoMojibake(rel) {
  const text = read(rel);
  const badMarkers = [
    '\uFFFD',
    '\u0420\u040F',
    '\u0420\u00A1',
    '\u0420\u2019',
    '\u0421\u201A',
    '\u0421\u201C',
    '\u00D0\u00A0',
    '\u00D0\u00A1',
    '????',
  ];
  const found = badMarkers.filter((marker) => text.includes(marker));
  if (found.length) {
    throw new Error(`Mojibake marker found in ${rel}: ${found.join(', ')}`);
  }
  console.log(`OK: ${rel}`);
}

requireIncludes('src/data/stock-control-center-foundation.js', [
  'STEP_4_9_STOCK_CONTROL_CENTER_MARKER',
  'STOCK_CONTROL_CENTER_MODULES',
  'STOCK_CONTROL_CENTER_QUALITY_GATES',
  'STOCK_CONTROL_CENTER_OPERATOR_RULES',
  'getStockControlCenterFoundation',
], 'Step 4.9 foundation surface');

requireIncludes('src/services/stock-control-center-service.js', [
  'STEP_4_9_STOCK_CONTROL_CENTER_SERVICE_MARKER',
  'getStockControlCenterData',
  'getStockControlCenterSummary',
  'buildConsolidatedTimeline',
  'buildOperatorChecklist',
], 'Step 4.9 service surface');

requireIncludes('src/routes/stock-control-center-routes.js', [
  'STEP_4_9_STOCK_CONTROL_CENTER_ROUTES_MARKER',
  '/stock-control-center',
  '/api/stock/control-center/ping',
  '/api/stock/control-center/foundation',
  '/api/stock/control-center/summary',
], 'Step 4.9 route surface');

requireIncludes('views/pages/stock-control-center.hbs', [
  'data-step="4.9"',
  'ag-stock-control-center',
  '/stock-adjustments',
  '/stock-transfer-center',
  '/api/stock/control-center/summary',
], 'Step 4.9 UI surface');

requireIncludes('src/server.js', [
  'stock-control-center-routes.js',
  'stockControlCenterRouter',
  'STEP_4_9_STOCK_CONTROL_CENTER_SERVER_MARKER',
], 'Step 4.9 server registration');

requireIncludes('public/css/styles.css', [
  'Step 4.9 Stock Control Center',
  'ag-stock-control-center',
], 'Step 4.9 CSS surface');

requireIncludes('package.json', [
  '0.4.19',
], 'Step 4.9 package version');

[
  'src/data/stock-control-center-foundation.js',
  'src/services/stock-control-center-service.js',
  'src/routes/stock-control-center-routes.js',
  'views/pages/stock-control-center.hbs',
].forEach(ensureNoMojibake);

console.log('OK: Step 4.9 stock control center smoke markers passed.');
