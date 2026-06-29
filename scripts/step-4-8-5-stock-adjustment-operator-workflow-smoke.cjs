const fs = require('fs');
const path = require('path');

const root = process.cwd();
const required = [
  ['package.json', 'Step 4.8.5 Stock Adjustment Final Polish / Operator Workflow Hardening'],
  ['src/data/stock-adjustment-operator-workflow-foundation.js', 'STEP_4_8_5_OPERATOR_WORKFLOW_HARDENING'],
  ['src/services/stock-adjustment-operator-workflow-service.js', 'getStockAdjustmentOperatorWorkflowPanel'],
  ['src/data/stock-adjustment-foundation.js', 'stock-adjustment-operator-workflow-foundation.js'],
  ['src/services/stock-adjustment-service.js', 'stock-adjustment-operator-workflow-service.js'],
  ['views/pages/stock-adjustments.hbs', 'stock-adjustment-operator-workflow-hardening'],
  ['public/css/styles.css', 'STEP 4.8.5 STOCK ADJUSTMENT OPERATOR WORKFLOW HARDENING'],
  ['docs/steps/STEP_4_8_5_STOCK_ADJUSTMENT_FINAL_POLISH_OPERATOR_WORKFLOW_HARDENING_BG.md', 'Step 4.8.5'],
  ['docs/checkpoints/STEP_4_8_5_STOCK_ADJUSTMENT_FINAL_POLISH_OPERATOR_WORKFLOW_HARDENING_BG.md', 'Step 4.8.5']
];

let failed = false;
for (const [file, marker] of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.error(`MISSING FILE: ${file}`);
    failed = true;
    continue;
  }
  const text = fs.readFileSync(full, 'utf8');
  if (!text.includes(marker)) {
    console.error(`MISSING MARKER: ${marker} in ${file}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('OK: Step 4.8.5 operator workflow hardening smoke markers passed.');
