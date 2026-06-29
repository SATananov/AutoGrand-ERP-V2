#!/usr/bin/env node
/* AutoGrand ERP V2 Step 4.8.6 final QA / clean export smoke.
   ASCII-only source on purpose: Windows PowerShell 5.1 and old editors must not corrupt this file.
   This smoke checks integration surfaces without overfitting to one exact implementation word. */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
function read(rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${rel}`);
  return fs.readFileSync(file, 'utf8');
}
function ok(label) {
  console.log(`OK: ${label}`);
}
function hasAny(text, terms) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(String(term).toLowerCase()));
}
function requireIncludes(rel, label, terms) {
  const text = read(rel);
  const missing = terms.filter((term) => !text.includes(term));
  if (missing.length) throw new Error(`${label} missing in ${rel}: ${missing.join(', ')}`);
  ok(label);
}
function requireAny(rel, label, terms) {
  const text = read(rel);
  if (!hasAny(text, terms)) throw new Error(`${label} missing in ${rel}: one of ${terms.join(', ')}`);
  ok(label);
}
function requireSurface(rel, label, groups) {
  const text = read(rel);
  const missingGroups = [];
  for (const group of groups) {
    if (!hasAny(text, group)) missingGroups.push(`[${group.join(' OR ')}]`);
  }
  if (missingGroups.length) throw new Error(`${label} missing in ${rel}: ${missingGroups.join(', ')}`);
  ok(label);
}
function assertNoBadEncoding(rel) {
  const text = read(rel);
  const questionMarker = '?' + '?' + '?' + '?';
  const markers = [
    questionMarker,
    '\uFFFD',
    '\u0420\u045F',
    '\u0420 \u0421\u045F',
    '\u0420 \u0412\u00B1',
    '\u0420  \u0421\u045F',
    '\u0420  \u0421\u2013',
    '\u0420  \u0420 \u2026',
    '\u0420  \u0412\u00B0',
    '\u0420\u040E\u0420 \u0421\u201C',
    '\u0420\u040E\u0420\u0406\u0420\u201A\u0421\u2122',
    '\u0421\u045A',
    '\u0420\u0406\u0420\u201A'
  ];
  for (const marker of markers) {
    if (text.includes(marker)) throw new Error(`Bad encoding marker found in ${rel}`);
  }
  ok(`encoding guard ${rel}`);
}

const requiredFiles = [
  'src/data/stock-adjustment-foundation.js',
  'src/services/stock-adjustment-persistence-service.js',
  'src/services/stock-adjustment-movement-binding-service.js',
  'src/services/stock-adjustment-operator-workflow-service.js',
  'src/services/stock-adjustment-service.js',
  'src/routes/stock-adjustment-routes.js',
  'views/pages/stock-adjustments.hbs',
  'scripts/step-4-8-1-stock-adjustment-smoke.cjs',
  'scripts/step-4-8-2-stock-adjustment-movement-binding-smoke.cjs',
  'scripts/step-4-8-3-stock-adjustment-movement-trace-visibility-smoke.cjs',
  'scripts/step-4-8-4-stock-adjustment-audit-reversal-safety-smoke.cjs',
  'scripts/step-4-8-5-stock-adjustment-operator-workflow-smoke.cjs',
  'scripts/step-4-8-6-stock-adjustment-final-qa-clean-export-smoke.cjs',
  'docs/steps/STEP_4_8_6_STOCK_ADJUSTMENT_FINAL_QA_CLEAN_EXPORT_CHECKPOINT_BG.md',
  'docs/checkpoints/STEP_4_8_6_STOCK_ADJUSTMENT_FINAL_QA_CLEAN_EXPORT_CHECKPOINT_BG.md'
];
for (const rel of requiredFiles) {
  read(rel);
  ok(rel);
}

requireIncludes('src/routes/stock-adjustment-routes.js', 'stock adjustment route API surface', [
  'movement-trace',
  'audit',
  'reversal-preview',
  'reversal-draft'
]);
requireIncludes('src/services/stock-adjustment-persistence-service.js', 'persistent stock adjustment table surface', [
  'ag_stock_adjustment_documents',
  'ag_stock_adjustment_lines'
]);
requireSurface('src/services/stock-adjustment-movement-binding-service.js', 'movement binding integration surface', [
  ['movement'],
  ['adjustment', 'stock adjustment', 'STOCK_ADJUSTMENT'],
  ['posted', 'bind', 'binding', 'source', 'document']
]);
requireSurface('src/services/stock-adjustment-service.js', 'stock adjustment service integration surface', [
  ['movementTrace', 'movement trace', 'movement'],
  ['audit'],
  ['reversal']
]);
requireSurface('views/pages/stock-adjustments.hbs', 'stock adjustment operator UI surface', [
  ['movement trace', 'movement-trace', 'trace'],
  ['audit'],
  ['reversal'],
  ['operator', 'workflow', 'posted', 'draft']
]);
requireSurface('src/data/stock-adjustment-operator-workflow-foundation.js', 'operator workflow foundation surface', [
  ['DRAFT'],
  ['POSTED'],
  ['reversal']
]);
requireAny('package.json', 'package version surface', ['0.4.18', '0.4.19', '0.4.20', '0.4.21']);

const activeEncodingFiles = [
  'src/data/stock-adjustment-foundation.js',
  'src/services/stock-adjustment-persistence-service.js',
  'src/services/stock-adjustment-movement-binding-service.js',
  'src/services/stock-adjustment-operator-workflow-service.js',
  'src/services/stock-adjustment-service.js',
  'src/routes/stock-adjustment-routes.js',
  'views/pages/stock-adjustments.hbs',
  'scripts/step-4-8-6-stock-adjustment-final-qa-clean-export-smoke.cjs'
];
for (const rel of activeEncodingFiles) assertNoBadEncoding(rel);

const applyActive = process.env.AUTOGRAND_STEP_486_ACTIVE_APPLY === '1';
if (applyActive) {
  ok('clean export hygiene skipped for active apply run');
} else {
  const rootNames = fs.readdirSync(root);
  const badRoot = rootNames.filter((name) =>
    /^apply_step_4_8_/.test(name) ||
    name === 'changed-files' ||
    /_CHANGED-FILES_/.test(name) ||
    /encoding-backup$/i.test(name)
  );
  if (badRoot.length) throw new Error(`Clean export hygiene failed: ${badRoot.join(', ')}`);
  ok('clean export hygiene passed');
}

ok('Step 4.8.6 final QA clean export checkpoint smoke markers passed');
