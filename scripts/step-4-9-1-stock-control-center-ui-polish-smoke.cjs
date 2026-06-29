const fs = require('fs');
const path = require('path');

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function exists(rel) {
  if (!fs.existsSync(path.join(root, rel))) {
    throw new Error(`Missing required file: ${rel}`);
  }
  console.log(`OK: ${rel}`);
}

function requireIncludes(rel, tokens, label) {
  const content = read(rel);
  const missing = tokens.filter((token) => !content.includes(token));
  if (missing.length) {
    throw new Error(`${label} missing in ${rel}: ${missing.join(', ')}`);
  }
  console.log(`OK: ${label}`);
}

function ensureNoMojibake(rel) {
  const content = read(rel);
  const markers = [String.fromCharCode(65533), String.fromCharCode(63, 63, 63, 63)];
  const found = markers.filter((marker) => content.includes(marker));
  if (found.length) {
    throw new Error(`Encoding guard failed for ${rel}`);
  }
  console.log(`OK: encoding guard ${rel}`);
}

[
  'src/data/stock-control-center-foundation.js',
  'src/services/stock-control-center-service.js',
  'src/routes/stock-control-center-routes.js',
  'views/pages/stock-control-center.hbs',
  'scripts/step-4-9-1-stock-control-center-ui-polish-smoke.cjs',
  'docs/steps/STEP_4_9_1_STOCK_CONTROL_CENTER_UI_POLISH_OPERATOR_DASHBOARD_BG.md',
  'docs/checkpoints/STEP_4_9_1_STOCK_CONTROL_CENTER_UI_POLISH_OPERATOR_DASHBOARD_BG.md',
].forEach(exists);

requireIncludes('src/data/stock-control-center-foundation.js', [
  'STOCK_CONTROL_CENTER_STEP',
  'STOCK_CONTROL_CENTER_LANES',
  'STOCK_CONTROL_CENTER_METRICS',
  'STOCK_CONTROL_CENTER_OPERATOR_CHECKLIST',
  'STOCK_CONTROL_CENTER_SAFETY_RULES',
  'getStockControlCenterFoundation',
], 'Step 4.9.1 foundation surface');

requireIncludes('src/services/stock-control-center-service.js', [
  'getStockControlCenterSummary',
  'getStockControlCenterViewModel',
  'getStockControlCenterPing',
  'buildControlCards',
  'buildQaPanels',
  'stepSummary',
], 'Step 4.9.1 service surface');

requireIncludes('src/routes/stock-control-center-routes.js', [
  '/stock-control-center',
  '/api/stock/control-center/ping',
  '/api/stock/control-center/foundation',
  '/api/stock/control-center/summary',
  '/api/stock/control-center/operator-checklist',
  'getStockControlCenterViewModel',
], 'Step 4.9.1 route surface');

requireIncludes('views/pages/stock-control-center.hbs', [
  'stock-control-center-v491',
  'Operator checklist',
  'Control lanes',
  'QA gates',
  'Safety rules',
  '{{#each metrics}}',
  '{{#each controlCards}}',
  '{{#each checklist}}',
], 'Step 4.9.1 UI surface');

requireIncludes('public/css/styles.css', [
  'AUTOGRAND_STEP_4_9_1_STOCK_CONTROL_CENTER_UI_POLISH_START',
  'stock-control-center-v491',
  'stock-control-center__metrics',
  'stock-control-center__timeline-row',
], 'Step 4.9.1 CSS surface');

requireIncludes('package.json', ['"version": "0.4.20"'], 'Step 4.9.1 package version');

[
  'src/data/stock-control-center-foundation.js',
  'src/services/stock-control-center-service.js',
  'src/routes/stock-control-center-routes.js',
  'views/pages/stock-control-center.hbs',
].forEach(ensureNoMojibake);

console.log('OK: Step 4.9.1 stock control center UI polish smoke passed.');
