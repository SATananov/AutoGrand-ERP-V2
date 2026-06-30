// AutoGrand ERP V2 - Step 4.13.4 smoke check
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
  assert(pkg.scripts['check:step4:13:4'] === 'node scripts/step-4-13-4-purchase-draft-preparation-handoff-smoke.cjs', 'missing check:step4:13:4 script');

  assertIncludes('src/server.js', "appVersion: 'v0.4.47'", 'server appVersion');
  assertIncludes('src/server.js', 'Step 4.13.4 Purchase Planning route mount', 'server route mount marker');
  assertIncludes('src/server.js', '4-13-4-purchase-planning-purchase-draft-preparation-manual-procurement-handoff', 'health marker');

  assertIncludes('src/routes/purchase-planning-routes.js', 'router.get("/purchase-planning/suppliers/:supplierKey/handoff"', 'handoff route');
  assertIncludes('src/routes/purchase-planning-routes.js', 'router.get("/api/purchase-planning/suppliers/:supplierKey/handoff"', 'handoff API route');
  assertIncludes('src/routes/purchase-planning-routes.js', 'res.render("purchase-planning"', 'fixed render path');
  assert(!read('src/routes/purchase-planning-routes.js').includes('res.render("pages/purchase-planning"'), 'render path must not include pages prefix');
  assert(!read('src/routes/purchase-planning-routes.js').includes('router.post('), 'purchase planning routes must remain read-only');

  assertIncludes('src/services/purchase-planning-service.js', 'STEP_4_13_4', 'step constant');
  assertIncludes('src/services/purchase-planning-service.js', 'buildPurchaseDraftPreparation', 'draft preparation builder');
  assertIncludes('src/services/purchase-planning-service.js', 'draftLines', 'draft lines model');
  assertIncludes('src/services/purchase-planning-service.js', 'copyBlock', 'operator copy block');
  assertIncludes('src/services/purchase-planning-service.js', 'Handoff подготовката не записва purchase header или lines', 'handoff guardrail');
  assertIncludes('src/services/purchase-planning-service.js', 'Няма stock posting, reversal, correction или journal mutation', 'stock mutation guardrail');

  assertIncludes('views/pages/purchase-planning.hbs', 'data-step="4.13.4"', 'view step marker');
  assertIncludes('views/pages/purchase-planning.hbs', 'ag-step-4134__handoff-card', 'handoff card view');
  assertIncludes('views/pages/purchase-planning.hbs', 'Purchase Draft Preparation / Manual Procurement Handoff', 'handoff title');
  assertIncludes('views/pages/purchase-planning.hbs', 'decisionCenter.purchaseDraftPreparation.draftLines', 'draft lines view');
  assertIncludes('views/pages/purchase-planning.hbs', 'decisionCenter.purchaseDraftPreparation.copyBlock', 'copy block view');
  assertIncludes('views/pages/purchase-planning.hbs', 'Отвори празен purchase документ', 'manual purchase action');
  assertIncludes('views/pages/purchase-planning.hbs', 'няма stock posting', 'view guardrail');

  assertIncludes('public/css/styles.css', 'Step 4.13.4 Purchase Draft Preparation Manual Procurement Handoff START', 'CSS start marker');
  assertIncludes('public/css/styles.css', '.ag-step-4134__handoff-card', 'handoff CSS');
  assertIncludes('public/css/styles.css', '.ag-step-4134__draft-table', 'draft table CSS');

  assertIncludes('src/services/permission-service.js', "'/purchase-planning/suppliers/:supplierKey/handoff'", 'permission handoff route');
  assertIncludes('src/services/permission-service.js', "'/api/purchase-planning/suppliers/:supplierKey/handoff'", 'permission handoff API route');

  assertIncludes('docs/steps/STEP_4_13_4_PURCHASE_DRAFT_PREPARATION_MANUAL_PROCUREMENT_HANDOFF_BG.md', 'Step 4.13.4', 'step docs');
  assertIncludes('docs/checkpoints/STEP_4_13_4_PURCHASE_DRAFT_PREPARATION_MANUAL_PROCUREMENT_HANDOFF_BG.md', '0.4.47', 'checkpoint docs');

  const service = await import(pathToFileURL(path.join(root, 'src/services/purchase-planning-service.js')).href);
  const snapshot = await service.getPurchasePlanningDecisionCenter();
  assert(snapshot.step === '4.13.4', `snapshot step must be 4.13.4, found ${snapshot.step}`);
  assert(snapshot.healthLabel === '4-13-4-purchase-planning-purchase-draft-preparation-manual-procurement-handoff', 'snapshot health label mismatch');
  assert(snapshot.purchaseDraftStep === '4.13.4', 'purchase draft step marker mismatch');
  assert(snapshot.detailInspectorStep === '4.13.3', 'detail inspector step marker mismatch');
  assert(snapshot.readOnly === true, 'snapshot must remain read-only');
  assert(snapshot.purchaseDraftPreparationActive === false, 'default handoff should be inactive');

  const supplier = snapshot.suppliers.find((row) => row.supplierKey) || snapshot.suppliers[0];
  assert(supplier, 'expected at least one supplier for handoff smoke');
  const detail = await service.getPurchasePlanningDecisionCenter({ supplier: supplier.supplierKey });
  assert(detail.detailInspectorActive === true, 'supplier drilldown must activate detail inspector');
  assert(detail.purchaseDraftPreparationActive === true, 'supplier drilldown must activate draft preparation');
  assert(detail.purchaseDraftPreparation.active === true, 'draft preparation must be active');
  assert(detail.purchaseDraftPreparation.documentType === 'PURCHASE_ORDER', 'draft document type mismatch');
  assert(Array.isArray(detail.purchaseDraftPreparation.draftLines), 'draft lines must be array');
  assert(Array.isArray(detail.purchaseDraftPreparation.checklist) && detail.purchaseDraftPreparation.checklist.length === 4, 'draft checklist mismatch');
  assert(detail.purchaseDraftPreparation.copyBlock.includes('Document type: PURCHASE_ORDER'), 'copy block must include document type');
  assert(detail.purchaseDraftPreparation.guardrails.some((line) => line.includes('не purchase документ')), 'draft guardrail mismatch');

  console.log('OK: Step 4.13.4 purchase draft preparation manual procurement handoff smoke markers passed.');
})().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
