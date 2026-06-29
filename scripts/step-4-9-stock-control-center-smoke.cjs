const fs = require('fs');
const path = require('path');

const root = process.cwd();
const requiredFiles = [
  'src/data/stock-control-center-foundation.js',
  'src/services/stock-control-center-service.js',
  'src/routes/stock-control-center-routes.js',
  'views/pages/stock-control-center.hbs',
  'scripts/step-4-9-stock-control-center-smoke.cjs',
  'docs/steps/STEP_4_9_STOCK_TRANSFER_ADJUSTMENT_CONSOLIDATION_INVENTORY_CONTROL_CENTER_BG.md',
  'docs/checkpoints/STEP_4_9_STOCK_TRANSFER_ADJUSTMENT_CONSOLIDATION_INVENTORY_CONTROL_CENTER_BG.md'
];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function requireFile(rel) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing required file: ${rel}`);
  console.log(`OK: ${rel}`);
}

function requireIncludes(rel, markers, label) {
  const text = read(rel);
  const missing = markers.filter((marker) => !text.includes(marker));
  if (missing.length) throw new Error(`${label} missing in ${rel}: ${missing.join(', ')}`);
  console.log(`OK: ${label}`);
}

function ensureNoMojibake(rel) {
  const text = read(rel);
  const markers = ['\uFFFD', '?'.repeat(4)];
  const found = markers.filter((marker) => text.includes(marker));
  if (found.length) throw new Error(`Mojibake marker found in ${rel}: ${found.join(', ')}`);
  console.log(`OK: encoding guard ${rel}`);
}

function requireVersionAtLeast(version) {
  const pkg = JSON.parse(read('package.json'));
  const current = String(pkg.version || '0.0.0').split('.').map((item) => Number.parseInt(item, 10));
  const expected = String(version).split('.').map((item) => Number.parseInt(item, 10));
  for (let i = 0; i < expected.length; i += 1) {
    if ((current[i] || 0) > expected[i]) return console.log(`OK: package version ${pkg.version}`);
    if ((current[i] || 0) < expected[i]) throw new Error(`Expected package version >= ${version}, got ${pkg.version}`);
  }
  console.log(`OK: package version ${pkg.version}`);
}

requiredFiles.forEach(requireFile);

requireIncludes('src/data/stock-control-center-foundation.js', [
  'STOCK_CONTROL_CENTER_STAGE',
  'getStockControlCenterFoundation',
  'stockControlCenterCheckpointTimeline'
], 'Step 4.9 foundation surface');

requireIncludes('src/services/stock-control-center-service.js', [
  'getStockControlCenterSummary',
  'getStockControlCenterOperatorChecklist',
  'getStockControlCenterOperationalDashboard'
], 'Step 4.9 service surface');

requireIncludes('src/routes/stock-control-center-routes.js', [
  '/stock-control-center',
  '/api/stock/control-center/ping',
  '/api/stock/control-center/summary'
], 'Step 4.9 route surface');

requireIncludes('views/pages/stock-control-center.hbs', [
  'Stock Control Center',
  'ag-stock-control-page',
  'ag-stock-operator-dashboard'
], 'Step 4.9 UI surface');

requireIncludes('src/server.js', [
  'stockControlCenterRouter',
  './routes/stock-control-center-routes.js'
], 'Step 4.9 server registration');

requireIncludes('public/css/styles.css', [
  'STEP 4.9 STOCK CONTROL CENTER',
  'ag-stock-control-page'
], 'Step 4.9 CSS surface');

requireVersionAtLeast('0.4.19');
[
  'src/data/stock-control-center-foundation.js',
  'src/services/stock-control-center-service.js',
  'src/routes/stock-control-center-routes.js',
  'views/pages/stock-control-center.hbs'
].forEach(ensureNoMojibake);

console.log('OK: Step 4.9 stock control center smoke markers passed.');
