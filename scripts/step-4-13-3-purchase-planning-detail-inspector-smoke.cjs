// AutoGrand ERP V2 - Step 4.13.3 smoke check
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..');
function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function assertIncludes(file, needle, label = needle) {
  const text = read(file);
  assert(text.includes(needle), `${file} missing marker: ${label}`);
}

(async () => {
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));

  assert(pkg.version === '0.4.47', `package version must be 0.4.47, found ${pkg.version}`);
  assert(lock.version === '0.4.47', `package-lock version must be 0.4.47, found ${lock.version}`);
  assert(lock.packages[''].version === '0.4.47', `package-lock root version must be 0.4.47, found ${lock.packages[''].version}`);
  assert(pkg.autograndStep === '4.13.4', `autograndStep must be 4.13.4, found ${pkg.autograndStep}`);
  assert(pkg.autograndHealthLabel === '4-13-4-purchase-planning-purchase-draft-preparation-manual-procurement-handoff', 'autograndHealthLabel mismatch');
  assert(pkg.scripts['check:step4:13:3'] === 'node scripts/step-4-13-3-purchase-planning-detail-inspector-smoke.cjs', 'missing check:step4:13:3 script');

  assertIncludes('src/server.js', "appVersion: 'v0.4.47'", 'server appVersion');
  assertIncludes('src/server.js', '4-13-4-purchase-planning-purchase-draft-preparation-manual-procurement-handoff', 'health marker');

  assertIncludes('src/routes/purchase-planning-routes.js', 'router.get("/purchase-planning/suppliers/:supplierKey"', 'supplier drilldown route');
  assertIncludes('src/routes/purchase-planning-routes.js', 'router.get("/api/purchase-planning/suppliers/:supplierKey"', 'supplier drilldown API route');
  assertIncludes('src/routes/purchase-planning-routes.js', 'res.render("purchase-planning"', 'fixed render path');
  assert(!read('src/routes/purchase-planning-routes.js').includes('res.render("pages/purchase-planning"'), 'render path must not include pages prefix');
  assert(!read('src/routes/purchase-planning-routes.js').includes('router.post('), 'purchase planning routes must remain read-only');

  assertIncludes('src/services/purchase-planning-service.js', 'STEP_4_13_3', 'step constant');
  assertIncludes('src/services/purchase-planning-service.js', 'buildSupplierDetailInspector', 'supplier detail inspector builder');
  assertIncludes('src/services/purchase-planning-service.js', 'recommendationLines', 'recommendation lines model');
  assertIncludes('src/services/purchase-planning-service.js', 'warehouseBreakdown', 'warehouse breakdown model');
  assertIncludes('src/services/purchase-planning-service.js', 'groupBreakdown', 'group breakdown model');
  assertIncludes('src/services/purchase-planning-service.js', 'Няма автоматично създаване на purchase', 'read-only guardrail');

  assertIncludes('views/pages/purchase-planning.hbs', 'data-step="4.13.4"', 'view step marker');
  assertIncludes('views/pages/purchase-planning.hbs', 'ag-step-4133__inspector-card', 'inspector card view');
  assertIncludes('views/pages/purchase-planning.hbs', 'Supplier Recommendation Drilldown', 'drilldown title');
  assertIncludes('views/pages/purchase-planning.hbs', 'decisionCenter.detailInspector.recommendationLines', 'recommendation lines view');
  assertIncludes('views/pages/purchase-planning.hbs', 'decisionCenter.detailInspector.warehouseBreakdown', 'warehouse breakdown view');
  assertIncludes('views/pages/purchase-planning.hbs', 'няма stock posting', 'view guardrail');

  assertIncludes('public/css/styles.css', 'Step 4.13.3 Purchase Planning Detail Inspector Supplier Recommendation Drilldown START', 'CSS start marker');
  assertIncludes('public/css/styles.css', '.ag-step-4133__inspector-card', 'inspector CSS');
  assertIncludes('public/css/styles.css', '.ag-step-4133__line-table', 'line table CSS');

  assertIncludes('src/services/permission-service.js', "'/purchase-planning/suppliers/:supplierKey'", 'permission route');
  assertIncludes('src/services/permission-service.js', "'/api/purchase-planning/suppliers/:supplierKey'", 'permission API route');

  assertIncludes('docs/steps/STEP_4_13_3_PURCHASE_PLANNING_DETAIL_INSPECTOR_SUPPLIER_DRILLDOWN_BG.md', 'Step 4.13.3', 'step docs');
  assertIncludes('docs/checkpoints/STEP_4_13_3_PURCHASE_PLANNING_DETAIL_INSPECTOR_SUPPLIER_DRILLDOWN_BG.md', '0.4.46', 'checkpoint docs');

  const service = await import(pathToFileURL(path.join(root, 'src/services/purchase-planning-service.js')).href);
  const snapshot = await service.getPurchasePlanningDecisionCenter();
  assert(snapshot.step === '4.13.4', `snapshot step must be 4.13.4, found ${snapshot.step}`);
  assert(snapshot.healthLabel === '4-13-4-purchase-planning-purchase-draft-preparation-manual-procurement-handoff', 'snapshot health label mismatch');
  assert(snapshot.detailInspectorStep === '4.13.3', 'detail inspector step marker mismatch');
  assert(snapshot.readOnly === true, 'snapshot must remain read-only');
  assert(Array.isArray(snapshot.suppliers), 'snapshot suppliers must be array');
  assert(snapshot.detailInspector && snapshot.detailInspector.active === false, 'default detail inspector should be inactive');

  const supplier = snapshot.suppliers.find((row) => row.supplierKey) || snapshot.suppliers[0];
  assert(supplier, 'expected at least one supplier for drilldown smoke');
  const detail = await service.getPurchasePlanningDecisionCenter({ supplier: supplier.supplierKey });
  assert(detail.detailInspectorActive === true, 'supplier drilldown must activate detail inspector');
  assert(detail.detailInspector.active === true, 'detail inspector must be active');
  assert(detail.detailInspector.supplierName === supplier.supplierName, 'detail inspector supplier mismatch');
  assert(Array.isArray(detail.detailInspector.metrics) && detail.detailInspector.metrics.length === 4, 'detail inspector metrics mismatch');
  assert(Array.isArray(detail.detailInspector.recommendationLines), 'detail inspector recommendation lines must be array');
  assert(Array.isArray(detail.detailInspector.warehouseBreakdown), 'detail inspector warehouse breakdown must be array');
  assert(Array.isArray(detail.detailInspector.groupBreakdown), 'detail inspector group breakdown must be array');
  assert(detail.detailInspector.guardrails.some((line) => line.includes('Няма автоматично създаване')), 'detail inspector guardrail mismatch');

  console.log('OK: Step 4.13.3 purchase planning detail inspector supplier drilldown smoke markers passed.');
})().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
