// AutoGrand ERP V2 - Step 4.12.2 Inventory Planning Detail Inspector smoke check
// CommonJS smoke runner for Windows PowerShell 5.1 and Node.js.
// Repair note: use viewMode=all for the runtime detail smoke so real datasets without
// reorder suggestions still validate the read-only item drilldown correctly.

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assertContains(rel, marker) {
  const text = read(rel);
  if (!text.includes(marker)) {
    throw new Error(`${rel} missing marker: ${marker}`);
  }
}

function assertNotContains(rel, marker) {
  const text = read(rel);
  if (text.includes(marker)) {
    throw new Error(`${rel} contains forbidden marker: ${marker}`);
  }
}

(async () => {
  assertContains("src/services/inventory-planning-service.js", "Step 4.12.2 Inventory Planning Detail Inspector");
  assertContains("src/services/inventory-planning-service.js", "getInventoryPlanningItemDetail");
  assertContains("src/services/inventory-planning-service.js", "detailHref");
  assertContains("src/routes/inventory-planning-routes.js", "/inventory-planning/item/:itemCode");
  assertContains("src/routes/inventory-planning-routes.js", "/api/stock/inventory-planning/items/:itemCode");
  assertContains("views/pages/inventory-planning.hbs", "data-step=\"4.12.2\"");
  assertContains("views/pages/inventory-planning.hbs", "ag-step-4122__detail-link");
  assertContains("views/pages/inventory-planning-item.hbs", "Item planning drilldown");
  assertContains("views/pages/inventory-planning-item.hbs", "Movement context");
  assertContains("public/css/styles.css", "AutoGrand ERP V2 Step 4.12.2 Inventory Planning Detail Inspector START");

  for (const rel of [
    "src/services/inventory-planning-service.js",
    "src/routes/inventory-planning-routes.js",
    "views/pages/inventory-planning.hbs",
    "views/pages/inventory-planning-item.hbs",
    "public/css/styles.css",
  ]) {
    assertNotContains(rel, "\uFFFD");
    assertNotContains(rel, String.fromCharCode(63, 63, 63, 63));
  }

  for (const forbidden of [
    "stockMovement.create",
    "stockMovement.update",
    "stockMovement.delete",
    "stockJournal.create",
    "stockJournal.update",
    "stockJournal.delete",
    "prisma.stockMovement",
    "prisma.stockJournal",
  ]) {
    assertNotContains("src/services/inventory-planning-service.js", forbidden);
  }

  const serviceUrl = pathToFileURL(path.join(root, "src/services/inventory-planning-service.js")).href;
  const service = await import(serviceUrl);
  if (typeof service.getInventoryPlanningSnapshot !== "function") {
    throw new Error("getInventoryPlanningSnapshot export missing");
  }
  if (typeof service.getInventoryPlanningItemDetail !== "function") {
    throw new Error("getInventoryPlanningItemDetail export missing");
  }

  const snapshot = await service.getInventoryPlanningSnapshot({ viewMode: "all" });
  if (!snapshot || snapshot.step !== "4.12.2") throw new Error("snapshot step mismatch");
  if (snapshot.readOnly !== true) throw new Error("snapshot must be read-only");
  if (!Array.isArray(snapshot.items) || snapshot.items.length < 1) throw new Error("items missing");
  if (!Array.isArray(snapshot.visibleItems) || snapshot.visibleItems.length < 1) throw new Error("visibleItems missing for all view");
  const first = snapshot.visibleItems[0];
  if (!first.detailHref || !first.detailHref.includes("/inventory-planning/item/")) throw new Error("detailHref missing");

  const detail = await service.getInventoryPlanningItemDetail(first.itemCode);
  if (!detail || detail.step !== "4.12.2") throw new Error("detail step mismatch");
  if (detail.readOnly !== true) throw new Error("detail must be read-only");
  if (!detail.item || detail.item.itemCode !== first.itemCode) throw new Error("detail item mismatch");
  if (!Array.isArray(detail.warehouseRows) || detail.warehouseRows.length < 1) throw new Error("warehouseRows missing");
  if (!Array.isArray(detail.movementTimeline) || detail.movementTimeline.length < 1) throw new Error("movementTimeline missing");
  if (!Array.isArray(detail.planningSignals) || detail.planningSignals.length < 3) throw new Error("planningSignals missing");
  if (!detail.manualRecommendation || detail.manualRecommendation.noAutomaticDocument !== true) throw new Error("manual recommendation guard missing");

  console.log("OK: Step 4.12.2 inventory planning detail inspector smoke markers passed.");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
