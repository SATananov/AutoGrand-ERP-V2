const fs = require("fs");
const path = require("path");

const root = process.cwd();
const required = [
  "src/data/stock-adjustment-foundation.js",
  "src/services/stock-adjustment-movement-binding-service.js",
  "src/services/stock-adjustment-persistence-service.js",
  "src/services/stock-adjustment-service.js",
  "src/routes/stock-adjustment-routes.js",
  "views/pages/stock-adjustments.hbs",
  "docs/steps/STEP_4_8_2_REAL_STOCK_ADJUSTMENT_POSTING_INTEGRATION_MOVEMENT_BINDING_BG.md",
  "docs/checkpoints/STEP_4_8_2_REAL_STOCK_ADJUSTMENT_POSTING_INTEGRATION_MOVEMENT_BINDING_BG.md"
];

const badMarkers = [
  String.fromCharCode(0xfffd),
  String.fromCharCode(63, 63, 63, 63),
  String.fromCharCode(0x0432, 0x0402),
  String.fromCharCode(0x0412, 0x00b7),
  String.fromCharCode(0x0420, 0x045f),
  String.fromCharCode(0x0420, 0x00b1),
  String.fromCharCode(0x0421, 0x0453)
];

for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing Step 4.8.2 file: ${rel}`);
  }
  const text = fs.readFileSync(full, "utf8");
  for (const marker of badMarkers) {
    if (text.includes(marker)) {
      throw new Error(`Mojibake marker ${JSON.stringify(marker)} found in ${rel}`);
    }
  }
}

const bindingText = fs.readFileSync(path.join(root, "src/services/stock-adjustment-movement-binding-service.js"), "utf8");
for (const needle of [
  "detectRealStockMovementBinding",
  "insertBoundStockAdjustmentMovement",
  "resolveStockMovementBinding",
  "STOCK_ADJUSTMENT_SOURCE_TYPE",
  "findExistingBoundStockMovement"
]) {
  if (!bindingText.includes(needle)) {
    throw new Error(`Step 4.8.2 movement binding marker missing: ${needle}`);
  }
}

const persistenceText = fs.readFileSync(path.join(root, "src/services/stock-adjustment-persistence-service.js"), "utf8");
for (const needle of [
  "insertStockMovement",
  "detectStockMovementTarget",
  "binding_profile",
  "movement_direction",
  "getStockAdjustmentMovementBindingHealth"
]) {
  if (!persistenceText.includes(needle)) {
    throw new Error(`Step 4.8.2 persistence marker missing: ${needle}`);
  }
}

const routeText = fs.readFileSync(path.join(root, "src/routes/stock-adjustment-routes.js"), "utf8");
for (const endpoint of [
  "/api/stock/adjustments/movement-binding",
  "/api/stock/adjustments/documents/:id/post",
  "/api/stock/adjustments/from-issue/persist"
]) {
  if (!routeText.includes(endpoint)) {
    throw new Error(`Step 4.8.2 route marker missing: ${endpoint}`);
  }
}

const foundationText = fs.readFileSync(path.join(root, "src/data/stock-adjustment-foundation.js"), "utf8");
for (const marker of ["4.8.2", "0.4.14", "realMovementBinding", "idempotentPosting"]) {
  if (!foundationText.includes(marker)) {
    throw new Error(`Step 4.8.2 foundation marker missing: ${marker}`);
  }
}

const viewText = fs.readFileSync(path.join(root, "views/pages/stock-adjustments.hbs"), "utf8");
for (const marker of ["data-ag-step=\"4.8.2\"", "agMovementBindingCard", "agReloadBindingBtn", "Movement trace"]) {
  if (!viewText.includes(marker)) {
    throw new Error(`Step 4.8.2 UI marker missing: ${marker}`);
  }
}

console.log("OK: Step 4.8.2 movement binding smoke markers passed.");
