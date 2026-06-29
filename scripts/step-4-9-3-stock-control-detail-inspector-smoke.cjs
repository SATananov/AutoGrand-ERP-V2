const fs = require('fs');
const path = require('path');

const root = process.cwd();

function fail(message) {
  console.error(message);
  process.exit(1);
}

function filePath(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  const absolutePath = filePath(relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`MISSING: ${relativePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf8').replace(/^\uFEFF/, '');
}

function readBytes(relativePath) {
  const absolutePath = filePath(relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`MISSING: ${relativePath}`);
  }
  return fs.readFileSync(absolutePath);
}

function assertContains(text, needle, label) {
  if (!text.includes(needle)) {
    fail(`MISSING MARKER: ${label}`);
  }
}

function assertNoReplacementBytes(relativePath) {
  const bytes = readBytes(relativePath);
  for (let index = 0; index + 2 < bytes.length; index += 1) {
    if (bytes[index] === 0xef && bytes[index + 1] === 0xbf && bytes[index + 2] === 0xbd) {
      fail(`MOJIBAKE BYTES: ${relativePath}`);
    }
  }
}

function assertNoAsciiMojibake(text, label) {
  const badMarkers = ['????', '\uFFFD'];
  for (const marker of badMarkers) {
    if (text.includes(marker)) {
      fail(`MOJIBAKE: ${label}`);
    }
  }
}

function scopedCssBlock(css) {
  const start = 'AutoGrand ERP V2 Step 4.9.3 Stock Control Detail Inspector START';
  const end = 'AutoGrand ERP V2 Step 4.9.3 Stock Control Detail Inspector END';
  const startIndex = css.indexOf(start);
  const endIndex = css.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    fail('MISSING MARKER: css Step 4.9.3 scoped block');
  }
  return css.slice(startIndex, endIndex + end.length);
}

const requiredFiles = [
  'src/services/stock-control-detail-inspector-service.js',
  'src/routes/stock-control-detail-inspector-routes.js',
  'views/pages/stock-control-detail-inspector.hbs',
  'public/js/ag-stock-control-detail-inspector.js',
  'public/css/styles.css',
  'src/server.js',
  'views/layouts/main.hbs',
  'views/pages/stock-control-center.hbs',
  'docs/steps/STEP_4_9_3_STOCK_CONTROL_CENTER_DRILLDOWN_DETAIL_INSPECTOR_BG.md',
  'docs/checkpoints/STEP_4_9_3_STOCK_CONTROL_CENTER_DRILLDOWN_DETAIL_INSPECTOR_CLEAN_EXPORT_BG.md'
];

for (const file of requiredFiles) {
  readText(file);
  assertNoReplacementBytes(file);
}

const service = readText('src/services/stock-control-detail-inspector-service.js');
assertContains(service, 'export async function getStockControlDetailInspector', 'service export getStockControlDetailInspector');
assertContains(service, 'function movementModelCandidates', 'service movement candidates');
assertContains(service, 'function analyzeReversal', 'service reversal analysis');
assertContains(service, 'function checklist', 'service checklist builder');
assertContains(service, 'function safeActions', 'service safe actions builder');
assertContains(service, 'stock movement journal is read-only', 'service read-only journal rule');
assertContains(service, 'correction/reversal goes through a separate document', 'service correction/reversal rule');
assertNoAsciiMojibake(service, 'service');

const route = readText('src/routes/stock-control-detail-inspector-routes.js');
assertContains(route, 'getStockControlDetailInspector', 'route service import');
assertContains(route, '/api/stock-control-center/inspect', 'route api inspect');
assertContains(route, '/stock-control-center/inspect', 'route page inspect');
assertContains(route, 'res.render("pages/stock-control-detail-inspector"', 'route render inspector page');
assertNoAsciiMojibake(route, 'route');

const page = readText('views/pages/stock-control-detail-inspector.hbs');
assertContains(page, 'data-ag-step="4.9.3-detail-inspector"', 'page step marker');
assertContains(page, 'Stock Control Detail Inspector', 'page title');
assertContains(page, 'Document summary', 'page document summary');
assertContains(page, 'Movement trace', 'page movement trace');
assertContains(page, 'Operator checklist', 'page operator checklist');
assertContains(page, 'Safe actions', 'page safe actions');
assertContains(page, 'Moneta-like control logic', 'page Moneta logic');
assertNoAsciiMojibake(page, 'page');

const browserScript = readText('public/js/ag-stock-control-detail-inspector.js');
assertContains(browserScript, 'ag-stock-control-detail-inspector-step-4-9-3', 'browser step marker');
assertContains(browserScript, '/stock-control-center/inspect', 'browser inspect URL');
assertContains(browserScript, 'enhanceStockControlDrilldown', 'browser enhancer');
assertContains(browserScript, 'data-ag-safe-action', 'browser safe action marker');
assertNoAsciiMojibake(browserScript, 'browser script');

const css = readText('public/css/styles.css');
const cssBlock = scopedCssBlock(css);
assertContains(cssBlock, '.ag-stock-control-inspector', 'css inspector shell');
assertContains(cssBlock, '.ag-inspector-grid', 'css inspector grid');
assertContains(cssBlock, '.ag-checklist', 'css checklist');
assertContains(cssBlock, '.ag-moneta-logic-list', 'css Moneta list');
assertContains(cssBlock, '.ag-button--safe', 'css safe action button');
assertNoAsciiMojibake(cssBlock, 'css Step 4.9.3 scoped block');

const server = readText('src/server.js');
assertContains(server, 'stock-control-detail-inspector-routes.js', 'server route import path');
assertContains(server, 'stockControlDetailInspectorRoutes', 'server route variable');
assertContains(server, 'app.use(stockControlDetailInspectorRoutes)', 'server route mount');
assertNoAsciiMojibake(server, 'server');

const layout = readText('views/layouts/main.hbs');
assertContains(layout, 'ag-stock-control-detail-inspector.js', 'layout inspector script');
assertNoAsciiMojibake(layout, 'layout');

const center = readText('views/pages/stock-control-center.hbs');
assertContains(center, '/stock-control-center/inspect', 'stock control center inspector entry');
assertContains(center, '4.9.3', 'stock control center step marker');

const stepDoc = readText('docs/steps/STEP_4_9_3_STOCK_CONTROL_CENTER_DRILLDOWN_DETAIL_INSPECTOR_BG.md');
assertContains(stepDoc, 'Step 4.9.3', 'step doc marker');
assertContains(stepDoc, 'Stock Control Center Drilldown', 'step doc title');

const checkpointDoc = readText('docs/checkpoints/STEP_4_9_3_STOCK_CONTROL_CENTER_DRILLDOWN_DETAIL_INSPECTOR_CLEAN_EXPORT_BG.md');
assertContains(checkpointDoc, '0.4.22', 'checkpoint package version');
assertContains(checkpointDoc, 'Step 4.9.3', 'checkpoint step marker');

const packageJson = JSON.parse(readText('package.json'));
if (packageJson.version !== '0.4.22') {
  fail(`PACKAGE VERSION: expected 0.4.22, got ${packageJson.version}`);
}

const packageLock = JSON.parse(readText('package-lock.json'));
if (packageLock.version && packageLock.version !== '0.4.22') {
  fail(`PACKAGE LOCK VERSION: expected 0.4.22, got ${packageLock.version}`);
}
if (packageLock.packages && packageLock.packages[''] && packageLock.packages[''].version !== '0.4.22') {
  fail(`PACKAGE LOCK ROOT VERSION: expected 0.4.22, got ${packageLock.packages[''].version}`);
}

console.log('OK: Step 4.9.3 real marker smoke check passed.');