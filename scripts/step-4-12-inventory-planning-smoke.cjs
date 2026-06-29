/* AutoGrand ERP V2 - Step 4.12 smoke check */
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = process.cwd();
const requiredFiles = [
  "src/services/inventory-planning-service.js",
  "src/routes/inventory-planning-routes.js",
  "views/pages/inventory-planning.hbs",
  "docs/steps/STEP_4_12_INVENTORY_PLANNING_REORDER_SUGGESTIONS_FOUNDATION_BG.md",
  "docs/checkpoints/STEP_4_12_INVENTORY_PLANNING_REORDER_SUGGESTIONS_FOUNDATION_BG.md",
];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  for (const rel of requiredFiles) {
    assert(fs.existsSync(path.join(root, rel)), `Missing required Step 4.12 file: ${rel}`);
  }

  const serviceText = read("src/services/inventory-planning-service.js");
  const routeText = read("src/routes/inventory-planning-routes.js");
  const viewText = read("views/pages/inventory-planning.hbs");
  const cssText = fs.existsSync(path.join(root, "public/css/styles.css")) ? read("public/css/styles.css") : "";

  assert(serviceText.includes("getInventoryPlanningSnapshot"), "Service export is missing.");
  assert(serviceText.includes("No automatic document creation"), "Read-only guardrail is missing from service.");
  assert(routeText.includes("/inventory-planning"), "Page route is missing.");
  assert(routeText.includes("/api/stock/inventory-planning"), "API route is missing.");
  assert(viewText.includes("Планиране на наличности"), "Bulgarian page title is missing.");
  assert(viewText.includes("Предложения за дозареждане"), "Reorder suggestions UI marker is missing.");
  assert(cssText.includes("AutoGrand ERP V2 Step 4.12 Inventory Planning START"), "Step 4.12 CSS block is missing.");

  const mod = await import(pathToFileURL(path.join(root, "src/services/inventory-planning-service.js")).href);
  assert(typeof mod.getInventoryPlanningSnapshot === "function", "Snapshot function is not exported.");
  const snapshot = await mod.getInventoryPlanningSnapshot();
  assert(snapshot && snapshot.readOnly === true, "Snapshot must be read-only.");
  assert(Array.isArray(snapshot.items) && snapshot.items.length > 0, "Snapshot items are empty.");
  assert(Array.isArray(snapshot.reorderSuggestions), "reorderSuggestions must be an array.");
  assert(Array.isArray(snapshot.slowMovingItems), "slowMovingItems must be an array.");
  assert(Array.isArray(snapshot.outOfStockRiskItems), "outOfStockRiskItems must be an array.");

  const badMarkers = ["\\uFFFD", "??" + "??", "\\u0432\\u0402"];
  for (const rel of requiredFiles.concat(["public/css/styles.css"])) {
    if (!fs.existsSync(path.join(root, rel))) continue;
    const text = read(rel);
    for (const marker of badMarkers) {
      assert(!text.includes(JSON.parse(`"${marker}"`)), `Encoding marker ${marker} found in ${rel}`);
    }
  }

  console.log("OK: Step 4.12 inventory planning smoke markers passed.");
})();
