const fs = require('fs');
const path = require('path');

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
  return fs.readFileSync(file, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function includesAny(text, needles, message) {
  const lower = text.toLowerCase();
  assert(needles.some((needle) => lower.includes(needle.toLowerCase())), message);
}

const root = process.cwd();
const pkg = JSON.parse(read(path.join(root, 'package.json')));
assert(pkg.version === '0.4.40', `package version must be 0.4.40, found ${pkg.version}`);

const requiredFiles = [
  'src/services/inventory-planning-service.js',
  'src/routes/inventory-planning-routes.js',
  'views/pages/inventory-planning.hbs',
  'views/pages/inventory-planning-item.hbs',
  'views/pages/inventory-planning-suppliers.hbs',
  'views/pages/inventory-planning-supplier.hbs',
  'scripts/step-4-12-inventory-planning-smoke.cjs',
  'scripts/step-4-12-1-inventory-planning-ui-polish-smoke.cjs',
  'scripts/step-4-12-2-inventory-planning-detail-inspector-smoke.cjs',
  'scripts/step-4-12-3-inventory-planning-supplier-purchase-smoke.cjs',
  'scripts/step-4-12-4-inventory-planning-final-qa-smoke.cjs',
  'docs/steps/STEP_4_12_INVENTORY_PLANNING_REORDER_SUGGESTIONS_FOUNDATION_BG.md',
  'docs/steps/STEP_4_12_1_INVENTORY_PLANNING_UI_POLISH_MANAGER_DASHBOARD_BG.md',
  'docs/steps/STEP_4_12_2_INVENTORY_PLANNING_DETAIL_INSPECTOR_ITEM_DRILLDOWN_BG.md',
  'docs/steps/STEP_4_12_3_INVENTORY_PLANNING_SUPPLIER_PURCHASE_RECOMMENDATION_VIEW_BG.md',
  'docs/steps/STEP_4_12_4_INVENTORY_PLANNING_FINAL_QA_CLEAN_MODULE_CLOSURE_BG.md',
  'docs/checkpoints/STEP_4_12_4_INVENTORY_PLANNING_FINAL_QA_CLEAN_MODULE_CLOSURE_BG.md'
];
for (const file of requiredFiles) read(path.join(root, file));

const serviceText = read(path.join(root, 'src/services/inventory-planning-service.js'));
const routeText = read(path.join(root, 'src/routes/inventory-planning-routes.js'));
const listViewText = read(path.join(root, 'views/pages/inventory-planning.hbs'));
const itemViewText = read(path.join(root, 'views/pages/inventory-planning-item.hbs'));
const suppliersViewText = read(path.join(root, 'views/pages/inventory-planning-suppliers.hbs'));
const supplierViewText = read(path.join(root, 'views/pages/inventory-planning-supplier.hbs'));
const sidebarPath = path.join(root, 'views/partials/sidebar.hbs');
const sidebarText = fs.existsSync(sidebarPath) ? read(sidebarPath) : '';
const serverText = read(path.join(root, 'src/server.js'));

includesAny(serviceText, ['reorder', 'minimum', 'min', 'slow', 'risk'], 'planning service must retain reorder/minimum/slow/risk signals');
includesAny(serviceText, ['supplier', 'purchase'], 'planning service must retain supplier/purchase recommendation support');
includesAny(routeText, ['/inventory-planning'], 'planning routes must expose inventory planning paths');
includesAny(routeText, ['/suppliers', 'supplierKey'], 'planning routes must expose supplier drilldown paths');
includesAny(routeText, ['itemCode', '/item/'], 'planning routes must expose item drilldown paths');
includesAny(serverText, ['inventoryPlanningRoutes', 'inventory-planning'], 'server must mount inventory planning routes');
includesAny(sidebarText, ['inventory-planning', 'Planning'], 'sidebar must contain inventory planning navigation');

const forbiddenRouteMutations = /router\s*\.\s*(post|put|patch|delete)\s*\(/i;
assert(!forbiddenRouteMutations.test(routeText), 'inventory planning routes must remain read-only GET routes');

const forbiddenJournalMutations = [
  /stockMovement\s*\.\s*(create|update|delete|upsert|deleteMany|updateMany)\s*\(/i,
  /stockJournal\s*\.\s*(create|update|delete|upsert|deleteMany|updateMany)\s*\(/i,
  /movementJournal\s*\.\s*(create|update|delete|upsert|deleteMany|updateMany)\s*\(/i
];
for (const pattern of forbiddenJournalMutations) {
  assert(!pattern.test(serviceText), 'inventory planning service must not mutate stock movement/journal data');
}

includesAny(listViewText, ['reorder', 'risk', 'planning', 'inventory-planning'], 'main planning view must show planning/reorder/risk context');
includesAny(itemViewText, ['item', 'movement', 'recommendation', 'inventory-planning'], 'item inspector view must show item detail context');
includesAny(suppliersViewText, ['supplier', 'purchase', 'recommendation', 'inventory-planning'], 'suppliers view must show supplier purchase recommendation context');
includesAny(supplierViewText, ['supplier', 'detail', 'purchase', 'inventory-planning'], 'supplier detail view must show supplier detail context');

const docsText = read(path.join(root, 'docs/steps/STEP_4_12_4_INVENTORY_PLANNING_FINAL_QA_CLEAN_MODULE_CLOSURE_BG.md'));
includesAny(docsText, ['read-only', 'decision-support', 'automatic document', 'guardrail'], 'closure docs must state read-only/no automatic document creation guardrails');
includesAny(docsText, ['4.12', '4.12.1', '4.12.2', '4.12.3', '4.12.4'], 'closure docs must list the whole 4.12 block');

const questionMarker = '?'.repeat(4);
for (const file of requiredFiles) {
  const text = read(path.join(root, file));
  assert(!text.includes('\uFFFD'), `replacement character found in ${file}`);
  assert(!text.includes(questionMarker), `question mark encoding marker found in ${file}`);
}

console.log('OK: Step 4.12.4 inventory planning final QA closure smoke markers passed.');
