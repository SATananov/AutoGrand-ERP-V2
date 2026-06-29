const fs = require("fs");
const path = require("path");

const root = process.cwd();
const checks = [
  ["src/data/stock-adjustment-foundation.js", "STOCK_ADJUSTMENT_REASON_CODES"],
  ["src/data/stock-adjustment-foundation.js", "reversalDraftSafety"],
  ["src/services/stock-adjustment-persistence-service.js", "ag_stock_adjustment_audit"],
  ["src/services/stock-adjustment-persistence-service.js", "createReversalDraftFromDocument"],
  ["src/services/stock-adjustment-persistence-service.js", "getStockAdjustmentAuditTrail"],
  ["src/routes/stock-adjustment-routes.js", "/api/stock/adjustments/documents/:id/audit"],
  ["src/routes/stock-adjustment-routes.js", "/api/stock/adjustments/documents/:id/reversal-draft"],
  ["views/pages/stock-adjustments.hbs", "ag-audit-safety-panel"],
  ["views/pages/stock-adjustments.hbs", "agCreateReversalDraftBtn"],
  ["docs/steps/STEP_4_8_4_STOCK_ADJUSTMENT_AUDIT_REVERSAL_SAFETY_LAYER_BG.md", "Step 4.8.4"]
];

let ok = true;
for (const [rel, marker] of checks) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`MISSING FILE: ${rel}`);
    ok = false;
    continue;
  }
  const text = fs.readFileSync(full, "utf8");
  if (!text.includes(marker)) {
    console.error(`MISSING MARKER: ${rel} -> ${marker}`);
    ok = false;
  }
}

if (!ok) process.exit(1);
console.log("OK: Step 4.8.4 audit reversal safety smoke markers passed.");
