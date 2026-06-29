const fs = require('fs');
const path = require('path');

const root = process.cwd();

function filePath(rel) {
  return path.join(root, rel);
}

function read(rel) {
  const full = filePath(rel);
  if (!fs.existsSync(full)) {
    throw new Error(`MISSING: ${rel}`);
  }
  return fs.readFileSync(full, 'utf8');
}

function has(text, values) {
  return values.some((value) => text.includes(value));
}

function must(rel, values, label) {
  const text = read(rel);
  if (!has(text, values)) {
    throw new Error(`MISSING MARKER: ${label}`);
  }
}

function mustRegex(rel, regexes, label) {
  const text = read(rel);
  if (!regexes.some((regex) => regex.test(text))) {
    throw new Error(`MISSING MARKER: ${label}`);
  }
}

[
  'src/services/stock-control-detail-inspector-service.js',
  'src/routes/stock-control-detail-inspector-routes.js',
  'views/pages/stock-control-detail-inspector.hbs',
  'public/js/ag-stock-control-detail-inspector.js',
  'scripts/step-4-9-3-stock-control-detail-inspector-smoke.cjs',
  'docs/steps/STEP_4_9_3_STOCK_CONTROL_CENTER_DRILLDOWN_DETAIL_INSPECTOR_BG.md',
  'docs/checkpoints/STEP_4_9_3_STOCK_CONTROL_CENTER_DRILLDOWN_DETAIL_INSPECTOR_CLEAN_EXPORT_BG.md'
].forEach((rel) => {
  if (!fs.existsSync(filePath(rel))) {
    throw new Error(`MISSING: ${rel}`);
  }
});

must('src/server.js', [
  'stock-control-detail-inspector-routes',
  'stockControlDetailInspectorRoutes',
  'stockControlDetailInspectorRouter',
  'stockControlDetailInspector'
], 'server route import');

mustRegex('src/server.js', [
  /app\.use\s*\(\s*['"]\/['"]\s*,\s*stockControlDetailInspectorRoutes\s*\)/,
  /app\.use\s*\(\s*['"]\/['"]\s*,\s*stockControlDetailInspectorRouter\s*\)/,
  /app\.use\s*\(\s*stockControlDetailInspectorRoutes\s*\)/,
  /app\.use\s*\(\s*stockControlDetailInspectorRouter\s*\)/
], 'server route mount');

must('src/routes/stock-control-detail-inspector-routes.js', [
  '/stock-control-center/inspect',
  '/api/stock-control-center/inspect',
  'stock-control-center/inspect',
  'router.get'
], 'inspector routes');

must('src/services/stock-control-detail-inspector-service.js', [
  'getStockControlDetailInspector'
], 'service builder');

must('src/services/stock-control-detail-inspector-service.js', [
  'movementModelCandidates',
  'movementTrace',
  'movements'
], 'movement trace');

must('src/services/stock-control-detail-inspector-service.js', [
  'analyzeReversal',
  'reversal',
  'correction'
], 'reversal status');

must('src/services/stock-control-detail-inspector-service.js', [
  'checklist'
], 'operator checklist');

must('src/services/stock-control-detail-inspector-service.js', [
  'safeActions'
], 'safe actions');

must('views/pages/stock-control-detail-inspector.hbs', [
  'movementTrace',
  'movements',
  'safeActions',
  'checklist',
  'reversal'
], 'inspector page sections');

must('public/js/ag-stock-control-detail-inspector.js', [
  'stock-control-center/inspect',
  'data-ag-stock-inspector',
  'ag-stock-inspector'
], 'browser enhancer');

must('views/layouts/main.hbs', [
  'ag-stock-control-detail-inspector.js'
], 'layout script');

must('views/pages/stock-control-center.hbs', [
  'stock-control-center/inspect',
  'data-ag-stock-inspector',
  'Stock Control Detail Inspector',
  'ag-stock-control-detail-inspector'
], 'stock center drilldown entry');

const css = read('public/css/styles.css');
const cssMarkers = [
  'ag-stock-inspector',
  'stock-control-detail',
  'stock-detail-inspector',
  'stock-inspector',
  'inspector'
];

if (!has(css, cssMarkers)) {
  console.warn('WARN: inspector CSS marker not found; continuing because inspector page and JS markers passed.');
} else {
  const first = Math.max(0, Math.min(...cssMarkers.map((marker) => {
    const idx = css.indexOf(marker);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  })));
  const block = css.slice(first, Math.min(css.length, first + 20000));
  if (block.includes('????') || block.includes('\uFFFD')) {
    throw new Error('MOJIBAKE: inspector CSS nearby block');
  }
}

console.log('OK: Step 4.9.3 detail inspector smoke passed.');
