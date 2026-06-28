const fs = require("fs");
const path = require("path");

const root = process.cwd();
const required = [
  "src/data/stock-adjustment-foundation.js",
  "src/services/stock-adjustment-persistence-service.js",
  "src/services/stock-adjustment-service.js",
  "src/routes/stock-adjustment-routes.js",
  "views/pages/stock-adjustments.hbs",
  "docs/steps/STEP_4_8_1_PERSISTENT_STOCK_ADJUSTMENT_DOCUMENTS_POSTING_LOCK_BG.md",
  "docs/checkpoints/STEP_4_8_1_PERSISTENT_STOCK_ADJUSTMENT_DOCUMENTS_POSTING_LOCK_BG.md"
];

for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing Step 4.8.1 file: ${rel}`);
  }
  const text = fs.readFileSync(full, "utf8");
  for (const marker of [String.fromCharCode(0xfffd), String.fromCharCode(63, 63, 63, 63), String.fromCharCode(0x0432, 0x0402), String.fromCharCode(0x0412, 0x00b7)]) {
    if (text.includes(marker)) {
      throw new Error(`Mojibake marker ${JSON.stringify(marker)} found in ${rel}`);
    }
  }
}

const serviceText = fs.readFileSync(path.join(root, "src/services/stock-adjustment-persistence-service.js"), "utf8");
for (const needle of ["ag_stock_adjustment_documents", "POSTED", "insertStockMovement", "detectStockMovementTarget"]) {
  if (!serviceText.includes(needle)) {
    throw new Error(`Step 4.8.1 persistence marker missing: ${needle}`);
  }
}

const routeText = fs.readFileSync(path.join(root, "src/routes/stock-adjustment-routes.js"), "utf8");
for (const endpoint of ["/api/stock/adjustments/documents", "/api/stock/adjustments/documents/:id/post", "/api/stock/adjustments/from-issue/persist"]) {
  if (!routeText.includes(endpoint)) {
    throw new Error(`Step 4.8.1 route marker missing: ${endpoint}`);
  }
}

console.log("OK: Step 4.8.1 smoke markers passed.");
