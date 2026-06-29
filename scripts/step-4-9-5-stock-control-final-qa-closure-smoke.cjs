const fs = require('fs');
const path = require('path');

const root = process.cwd();
const replacementChar = String.fromCharCode(0xfffd);

function file(rel) {
  return path.join(root, rel);
}

function read(rel) {
  const full = file(rel);
  if (!fs.existsSync(full)) {
    throw new Error(`MISSING: ${rel}`);
  }
  return fs.readFileSync(full, 'utf8');
}

function must(rel, markers, label) {
  const text = read(rel);
  if (!markers.some((marker) => text.includes(marker))) {
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
  'public/js/ag-stock-control-final-qa-closure.js',
  'scripts/step-4-9-5-stock-control-final-qa-closure-smoke.cjs',
  'docs/steps/STEP_4_9_5_STOCK_CONTROL_CENTER_FINAL_QA_CLOSURE_BG.md',
  'docs/checkpoints/STEP_4_9_5_STOCK_CONTROL_CENTER_FINAL_QA_CLOSURE_CLEAN_EXPORT_BG.md',
  'scripts/step-4-9-3-stock-control-detail-inspector-smoke.cjs',
  'scripts/step-4-9-4-stock-control-inspector-polish-smoke.cjs'
].forEach((rel) => {
  if (!fs.existsSync(file(rel))) {
    throw new Error(`MISSING: ${rel}`);
  }
});

const packageJson = JSON.parse(read('package.json'));
if (packageJson.version !== '0.4.25') {
  throw new Error(`PACKAGE VERSION: expected 0.4.25, got ${packageJson.version}`);
}

must('views/layouts/main.hbs', [
  'ag-stock-control-detail-inspector.js'
], 'Step 4.9.3 layout script');

must('views/layouts/main.hbs', [
  'ag-stock-control-inspector-polish.js'
], 'Step 4.9.4 layout script');

must('views/layouts/main.hbs', [
  'ag-stock-control-final-qa-closure.js'
], 'Step 4.9.5 layout script');

must('public/js/ag-stock-control-final-qa-closure.js', [
  'data-ag-step-4-9-5-closure'
], 'closure panel marker');

must('public/js/ag-stock-control-final-qa-closure.js', [
  '/stock-control-center'
], 'closure stock center link');

must('public/js/ag-stock-control-final-qa-closure.js', [
  'window.print'
], 'closure print QA action');

must('public/js/ag-stock-control-final-qa-closure.js', [
  'navigator.clipboard',
  'execCommand'
], 'closure copy QA action');

must('public/js/ag-stock-control-final-qa-closure.js', [
  'Read-only QA',
  'POSTED locked',
  'Step 4.9.5'
], 'closure safety labels');

must('public/css/styles.css', [
  'AG STEP 4.9.5 STOCK CONTROL FINAL QA CLOSURE'
], 'Step 4.9.5 CSS marker');

must('public/css/styles.css', [
  'ag-stock-closure-panel',
  'ag-stock-closure-action',
  '@media print'
], 'Step 4.9.5 CSS classes');

mustRegex('src/server.js', [
  /app\.use\s*\(\s*['"]\/['"]\s*,\s*stockControlDetailInspectorRoutes\s*\)/,
  /app\.use\s*\(\s*['"]\/['"]\s*,\s*stockControlDetailInspectorRouter\s*\)/,
  /app\.use\s*\(\s*stockControlDetailInspectorRoutes\s*\)/,
  /app\.use\s*\(\s*stockControlDetailInspectorRouter\s*\)/
], 'existing Step 4.9.3 inspector route mount');

[
  'public/js/ag-stock-control-final-qa-closure.js',
  'public/css/styles.css'
].forEach((rel) => {
  const text = read(rel);
  if (text.includes('????') || text.includes(replacementChar)) {
    throw new Error(`MOJIBAKE: ${rel}`);
  }
});

const css = read('public/css/styles.css');
const start = css.indexOf('AG STEP 4.9.5 STOCK CONTROL FINAL QA CLOSURE');
const end = css.indexOf('END AG STEP 4.9.5 STOCK CONTROL FINAL QA CLOSURE');
if (start < 0 || end < start) {
  throw new Error('MISSING MARKER: Step 4.9.5 CSS bounds');
}
const block = css.slice(start, end);
if (block.includes('????') || block.includes(replacementChar)) {
  throw new Error('MOJIBAKE: Step 4.9.5 CSS block');
}

console.log('OK: Step 4.9.5 stock control final QA closure smoke passed.');
