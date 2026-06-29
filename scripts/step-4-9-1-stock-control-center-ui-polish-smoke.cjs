const fs = require('fs');
const path = require('path');

const root = process.cwd();

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

[
  'src/data/stock-control-center-foundation.js',
  'src/services/stock-control-center-service.js',
  'src/routes/stock-control-center-routes.js',
  'views/pages/stock-control-center.hbs',
  'scripts/step-4-9-1-stock-control-center-ui-polish-smoke.cjs',
  'docs/steps/STEP_4_9_1_STOCK_CONTROL_CENTER_UI_POLISH_OPERATOR_DASHBOARD_BG.md',
  'docs/checkpoints/STEP_4_9_1_STOCK_CONTROL_CENTER_UI_POLISH_OPERATOR_DASHBOARD_BG.md'
].forEach(requireFile);

requireIncludes('views/pages/stock-control-center.hbs', [
  'ag-stock-operator-dashboard',
  'ag-stock-dashboard-card',
  'Operator checklist',
  'Stock checkpoint timeline'
], 'Step 4.9.1 operator dashboard UI surface');

requireIncludes('src/routes/stock-control-center-routes.js', [
  '/api/stock/control-center/operator-checklist',
  'getStockControlCenterOperatorChecklist'
], 'Step 4.9.1 operator checklist API surface');

requireIncludes('src/services/stock-control-center-service.js', [
  'getStockControlCenterOperatorChecklist',
  'checkpointTimeline',
  'counters'
], 'Step 4.9.1 service operator workflow surface');

requireIncludes('public/css/styles.css', [
  'STEP 4.9.1 STOCK CONTROL CENTER UI POLISH',
  'ag-stock-dashboard-card',
  'ag-stock-checkpoint-timeline'
], 'Step 4.9.1 CSS surface');

requireVersionAtLeast('0.4.20', '0.4.21');
console.log('OK: Step 4.9.1 stock control center UI polish smoke markers passed.');
