const fs = require("fs");
const path = require("path");

const root = process.cwd();
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function ok(label, condition) {
  if (!condition) {
    console.error("MISSING: " + label);
    process.exitCode = 1;
  } else {
    console.log("OK: " + label);
  }
}

const service = read("src/services/stock-adjustment-persistence-service.js");
const facade = read("src/services/stock-adjustment-service.js");
const routes = read("src/routes/stock-adjustment-routes.js");
const view = read("views/pages/stock-adjustments.hbs");

ok("Step 4.8.3 persistence marker", service.includes('const STEP = "4.8.3"'));
ok("movement trace normalizer", service.includes("function normalizeTraceRow"));
ok("trace summary builder", service.includes("function buildTraceSummary"));
ok("movement trace export", service.includes("export async function getStockAdjustmentMovementTrace"));
ok("document includes movementTrace", service.includes("movementTrace,") && service.includes("traceSummary"));
ok("facade exports movement trace", facade.includes("getStockAdjustmentMovementTrace"));
ok("movement trace API route", routes.includes('/movement-trace'));
ok("trace UI step marker", view.includes('data-ag-step="4.8.3"'));
ok("trace visibility panel", view.includes("Movement trace visibility"));
ok("posted lock panel", view.includes("ag-posted-lock-panel"));
ok("reload trace action", view.includes("agReloadTraceBtn") && view.includes("loadTrace"));

if (process.exitCode) {
  process.exit(process.exitCode);
}
console.log("OK: Step 4.8.3 movement trace visibility smoke markers passed.");
