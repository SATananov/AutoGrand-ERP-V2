// AutoGrand ERP V2 - Step 4.12.1 smoke check
// Read-only marker check. Does not start server and does not mutate data.

const fs = require("fs");
const path = require("path");

function read(file) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(full, "utf8");
}

function mustContain(file, markers) {
  const text = read(file);
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`Missing marker in ${file}: ${marker}`);
  }
}

function mustNotMatch(file, regexes) {
  const text = read(file);
  for (const regex of regexes) {
    if (regex.test(text)) throw new Error(`Forbidden pattern in ${file}: ${regex}`);
  }
}

mustContain("src/services/inventory-planning-service.js", [
  "Step 4.12.1 Inventory Planning UI Polish",
  "uiPolishVersion",
  "visibleItems",
  "filterChips",
  "attentionLanes",
  "warehouseBreakdown",
  "No automatic document creation",
]);

mustContain("src/routes/inventory-planning-routes.js", [
  "4-12-1-inventory-planning-ui-polish-manager-dashboard",
  "routeOptions",
  "router.get(\"/inventory-planning\"",
  "router.get(\"/api/stock/inventory-planning\"",
]);

mustContain("views/pages/inventory-planning.hbs", [
  "data-step=\"4.12.1\"",
  "ag-step-4121__command-strip",
  "snapshot.filterChips",
  "snapshot.attentionLanes",
  "snapshot.visibleItems",
  "snapshot.warehouseBreakdown",
  "snapshot.groupBreakdown",
]);

mustContain("public/css/styles.css", [
  "AutoGrand ERP V2 Step 4.12.1 Inventory Planning UI Polish START",
  "ag-step-4121__filterbar",
  "ag-step-4121__lanes",
  "ag-step-4121__breakdowns",
]);

const packageJson = JSON.parse(read("package.json"));
if (packageJson.version !== "0.4.37") throw new Error(`Unexpected package version: ${packageJson.version}`);

mustNotMatch("src/routes/inventory-planning-routes.js", [
  /router\.(post|put|patch|delete)\s*\(/,
]);

mustNotMatch("src/services/inventory-planning-service.js", [
  /\.create\s*\(/,
  /\.update\s*\(/,
  /\.delete\s*\(/,
  /\.upsert\s*\(/,
  /\$executeRaw/,
]);

for (const file of [
  "src/services/inventory-planning-service.js",
  "src/routes/inventory-planning-routes.js",
  "views/pages/inventory-planning.hbs",
  "public/css/styles.css",
]) {
  const text = read(file);
  const badQuestionMarker = String.fromCharCode(63, 63, 63, 63);
  for (const marker of ["\uFFFD", badQuestionMarker]) {
    if (text.includes(marker)) throw new Error(`Encoding marker found in ${file}`);
  }
}

console.log("OK: Step 4.12.1 inventory planning UI polish smoke markers passed.");
