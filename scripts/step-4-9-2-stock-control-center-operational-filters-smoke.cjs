const fs = require('fs');
const path = require('path');

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function exists(rel) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing required file: ${rel}`);
  console.log(`OK: ${rel}`);
}

function includes(rel, markers, label) {
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

function versionAtLeast(version) {
  const pkg = JSON.parse(read('package.json'));
  const current = String(pkg.version || '0.0.0').split('.').map((item) => Number.parseInt(item, 10));
  const expected = String(version).split('.').map((item) => Number.parseInt(item, 10));
  for (let i = 0; i < expected.length; i += 1) {
    if ((current[i] || 0) > expected[i]) return console.log(`OK: package version ${pkg.version}`);
    if ((current[i] || 0) < expected[i]) throw new Error(`Expected package version >= ${version}, got ${pkg.version}`);
  }
  console.log(`OK: package version ${pkg.version}`);
}

function cleanExportGuard() {
  if (process.env.AUTOGRAND_ACTIVE_APPLY === '1') {
    console.log('OK: clean export guard skipped during active apply');
    return;
  }
  const bad = ['changed-files', 'apply_step_4_9_2_stock_control_center_operational_filters.ps1']
    .filter((item) => fs.existsSync(path.join(root, item)));
  if (bad.length) throw new Error(`Clean export hygiene failed: ${bad.join(', ')}`);
  console.log('OK: clean export hygiene');
}

[
  'src/data/stock-control-center-foundation.js',
  'src/services/stock-control-center-service.js',
  'src/routes/stock-control-center-routes.js',
  'views/pages/stock-control-center.hbs',
  'scripts/step-4-9-stock-control-center-smoke.cjs',
  'scripts/step-4-9-1-stock-control-center-ui-polish-smoke.cjs',
  'scripts/step-4-9-2-stock-control-center-operational-filters-smoke.cjs',
  'docs/steps/STEP_4_9_2_STOCK_CONTROL_CENTER_OPERATIONAL_FILTERS_RISK_PANELS_BG.md',
  'docs/checkpoints/STEP_4_9_2_STOCK_CONTROL_CENTER_OPERATIONAL_FILTERS_RISK_PANELS_BG.md'
].forEach(exists);

includes('src/data/stock-control-center-foundation.js', [
  "STOCK_CONTROL_CENTER_STAGE = '4.9.2'",
  'stockControlCenterFilterDefinitions',
  'stockControlCenterRiskPanels',
  'stockControlCenterQuickActions'
], 'Step 4.9.2 foundation operational surface');

includes('src/services/stock-control-center-service.js', [
  'getStockControlCenterFilters',
  'getStockControlCenterRiskPanels',
  'getStockControlCenterQuickActions',
  'getStockControlCenterOperationalDashboard',
  'normalizeFilter'
], 'Step 4.9.2 service operational surface');

includes('src/routes/stock-control-center-routes.js', [
  '/api/stock/control-center/filters',
  '/api/stock/control-center/risk-panels',
  '/api/stock/control-center/quick-actions',
  '/api/stock/control-center/operational-dashboard'
], 'Step 4.9.2 API route surface');

includes('views/pages/stock-control-center.hbs', [
  'ag-stock-filter-strip',
  'ag-stock-risk-panel-list',
  'ag-stock-quick-action-list',
  'ag-stock-control-page--v492'
], 'Step 4.9.2 UI operational surface');

includes('public/css/styles.css', [
  'STEP 4.9.2 STOCK CONTROL CENTER OPERATIONAL FILTERS',
  'ag-stock-filter-strip',
  'ag-stock-risk-panel',
  'ag-stock-quick-action'
], 'Step 4.9.2 CSS operational surface');

versionAtLeast('0.4.21');
[
  'src/data/stock-control-center-foundation.js',
  'src/services/stock-control-center-service.js',
  'src/routes/stock-control-center-routes.js',
  'views/pages/stock-control-center.hbs',
  'scripts/step-4-9-2-stock-control-center-operational-filters-smoke.cjs'
].forEach(ensureNoMojibake);
cleanExportGuard();
console.log('OK: Step 4.9.2 operational filters / risk panels smoke markers passed.');
