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
  'public/js/ag-stock-control-inspector-polish.js',
  'scripts/step-4-9-4-stock-control-inspector-polish-smoke.cjs',
  'docs/steps/STEP_4_9_4_STOCK_CONTROL_CENTER_INSPECTOR_POLISH_BG.md',
  'docs/checkpoints/STEP_4_9_4_STOCK_CONTROL_CENTER_INSPECTOR_POLISH_CLEAN_EXPORT_BG.md'
].forEach((rel) => {
  if (!fs.existsSync(file(rel))) {
    throw new Error(`MISSING: ${rel}`);
  }
});

const packageJson = JSON.parse(read('package.json'));
const versionMatch = /^0\.4\.(\d+)$/.exec(packageJson.version);
if (!versionMatch || Number(versionMatch[1]) < 24) {
  throw new Error(`PACKAGE VERSION: expected 0.4.24 or newer, got ${packageJson.version}`);
}

must('views/layouts/main.hbs', [
  'ag-stock-control-inspector-polish.js'
], 'layout polish script');

must('public/js/ag-stock-control-inspector-polish.js', [
  'data-ag-step-4-9-4-toolbar'
], 'toolbar marker');

must('public/js/ag-stock-control-inspector-polish.js', [
  'window.print'
], 'print action');

must('public/js/ag-stock-control-inspector-polish.js', [
  'navigator.clipboard',
  'execCommand'
], 'copy reference action');

must('public/js/ag-stock-control-inspector-polish.js', [
  '/stock-control-center',
  '/api/stock-control-center/inspect'
], 'cross links');

must('public/js/ag-stock-control-inspector-polish.js', [
  'Read-only',
  'POSTED',
  'REVERSAL',
  'CORRECTION'
], 'status badges');

must('public/css/styles.css', [
  'AG STEP 4.9.4 STOCK CONTROL INSPECTOR POLISH'
], 'CSS block marker');

must('public/css/styles.css', [
  'ag-inspector-polish-toolbar',
  'ag-inspector-polish-action',
  '@media print'
], 'print-ready CSS');

mustRegex('src/server.js', [
  /app\.use\s*\(\s*['"]\/['"]\s*,\s*stockControlDetailInspectorRoutes\s*\)/,
  /app\.use\s*\(\s*['"]\/['"]\s*,\s*stockControlDetailInspectorRouter\s*\)/,
  /app\.use\s*\(\s*stockControlDetailInspectorRoutes\s*\)/,
  /app\.use\s*\(\s*stockControlDetailInspectorRouter\s*\)/
], 'existing Step 4.9.3 inspector route mount');

[
  'public/js/ag-stock-control-inspector-polish.js',
  'public/css/styles.css'
].forEach((rel) => {
  const text = read(rel);
  if (text.includes('????') || text.includes(replacementChar)) {
    throw new Error(`MOJIBAKE: ${rel}`);
  }
});

const css = read('public/css/styles.css');
const cssStart = css.indexOf('AG STEP 4.9.4 STOCK CONTROL INSPECTOR POLISH');
const cssEnd = css.indexOf('END AG STEP 4.9.4 STOCK CONTROL INSPECTOR POLISH');
if (cssStart < 0 || cssEnd < cssStart) {
  throw new Error('MISSING MARKER: Step 4.9.4 CSS bounds');
}
const cssBlock = css.slice(cssStart, cssEnd);
if (cssBlock.includes('????') || cssBlock.includes(replacementChar)) {
  throw new Error('MOJIBAKE: Step 4.9.4 CSS block');
}

console.log('OK: Step 4.9.4 inspector polish smoke passed.');
