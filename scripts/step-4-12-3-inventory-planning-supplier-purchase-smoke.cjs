// AutoGrand ERP V2 - Step 4.12.3 Inventory Planning Supplier Purchase Recommendation smoke check
// CommonJS smoke runner for Windows PowerShell 5.1 and Node.js.

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
  assertContains("src/services/inventory-planning-service.js", "Step 4.12.3 Inventory Planning Supplier");
  assertContains("src/services/inventory-planning-service.js", "getInventoryPlanningSupplierRecommendations");
  assertContains("src/services/inventory-planning-service.js", "getInventoryPlanningSupplierDetail");
  assertContains("src/routes/inventory-planning-routes.js", "/inventory-planning/suppliers");
  assertContains("src/routes/inventory-planning-routes.js", "/api/stock/inventory-planning/suppliers");
  assertContains("views/pages/inventory-planning.hbs", "data-step=\"4.12.3\"");
  assertContains("views/pages/inventory-planning-suppliers.hbs", "Доставчици и purchase препоръки");
  assertContains("views/pages/inventory-planning-supplier.hbs", "Supplier purchase detail");
  assertContains("public/css/styles.css", "AutoGrand ERP V2 Step 4.12.3 Inventory Planning Supplier Purchase View START");

  for (const rel of [
    "src/services/inventory-planning-service.js",
    "src/routes/inventory-planning-routes.js",
    "views/pages/inventory-planning.hbs",
    "views/pages/inventory-planning-item.hbs",
    "views/pages/inventory-planning-suppliers.hbs",
    "views/pages/inventory-planning-supplier.hbs",
    "public/css/styles.css",
  ]) {
    assertNotContains(rel, String.fromCharCode(0xfffd));
    assertNotContains(rel, String.fromCharCode(63, 63, 63, 63));
  }

  for (const forbidden of [
    "stockMovement.create",
    "stockMovement.update",
    "stockMovement.delete",
    "stockJournal.create",
    "stockJournal.update",
    "stockJournal.delete",
    "purchaseDocument.create",
    "purchaseOrder.create",
    "prisma.stockMovement",
    "prisma.stockJournal",
  ]) {
    assertNotContains("src/services/inventory-planning-service.js", forbidden);
  }

  const serviceUrl = pathToFileURL(path.join(root, "src/services/inventory-planning-service.js")).href;
  const service = await import(serviceUrl);
  if (typeof service.getInventoryPlanningSnapshot !== "function") throw new Error("getInventoryPlanningSnapshot export missing");
  if (typeof service.getInventoryPlanningItemDetail !== "function") throw new Error("getInventoryPlanningItemDetail export missing");
  if (typeof service.getInventoryPlanningSupplierRecommendations !== "function") throw new Error("getInventoryPlanningSupplierRecommendations export missing");
  if (typeof service.getInventoryPlanningSupplierDetail !== "function") throw new Error("getInventoryPlanningSupplierDetail export missing");

  const snapshot = await service.getInventoryPlanningSnapshot({ viewMode: "all" });
  if (!snapshot || snapshot.step !== "4.12.3") throw new Error("snapshot step mismatch");
  if (snapshot.readOnly !== true) throw new Error("snapshot must be read-only");
  if (!Array.isArray(snapshot.supplierRecommendations)) throw new Error("supplierRecommendations missing");
  if (!snapshot.supplierSummary || typeof snapshot.supplierSummary.supplierCount !== "number") throw new Error("supplierSummary missing");

  const supplierSnapshot = await service.getInventoryPlanningSupplierRecommendations({ viewMode: "all" });
  if (!supplierSnapshot || supplierSnapshot.step !== "4.12.3") throw new Error("supplier snapshot step mismatch");
  if (supplierSnapshot.readOnly !== true) throw new Error("supplier snapshot must be read-only");
  if (!Array.isArray(supplierSnapshot.supplierRecommendations) || supplierSnapshot.supplierRecommendations.length < 1) throw new Error("supplier recommendation rows missing");

  const firstSupplier = supplierSnapshot.supplierRecommendations[0];
  if (!firstSupplier.supplierHref || !firstSupplier.supplierHref.includes("/inventory-planning/suppliers/")) throw new Error("supplierHref missing");
  if (!Array.isArray(firstSupplier.purchaseLines)) throw new Error("purchaseLines missing");

  const supplierDetail = await service.getInventoryPlanningSupplierDetail(firstSupplier.supplierName);
  if (!supplierDetail || supplierDetail.step !== "4.12.3") throw new Error("supplier detail step mismatch");
  if (supplierDetail.readOnly !== true) throw new Error("supplier detail must be read-only");
  if (!supplierDetail.supplier || supplierDetail.supplier.supplierName !== firstSupplier.supplierName) throw new Error("supplier detail mismatch");
  if (!Array.isArray(supplierDetail.manualSteps) || supplierDetail.manualSteps.length < 1) throw new Error("manualSteps missing");
  if (!Array.isArray(supplierDetail.warehouseBreakdown)) throw new Error("supplier warehouse breakdown missing");

  console.log("OK: Step 4.12.3 inventory planning supplier purchase recommendation smoke markers passed.");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
