# Step 4.10 — Stock Reports / Inventory Analytics Foundation

## Purpose

Step 4.10 adds a read-only stock reporting and inventory analytics layer over the existing AutoGrand ERP V2 stock movement data.

The module is intentionally separate from the posting, reversal, correction and stock journal write paths.

## Moneta reference used

The uploaded Moneta ZIP was inspected as a reference point. The relevant structure is package-based:

- `InventoryPackage.bpl` — inventory journals, physical inventory, transfer shipment/receipt, revaluation, item checks, item relocation, serial/part/shelf logic.
- `BasePackage.bpl` — shared browse/filter/report foundations, document printing and posted document handling.
- `SalesPackage.bpl` and `PurchasePackage.bpl` — document browse screens with post/print and stock quantity preview actions.
- `AccountingPackage.bpl` — report generator pattern and read-oriented report result browsing.

AutoGrand does not copy the Moneta implementation. It follows the ERP idea: filter panel, browse grid, report cards, movement drilldown and print/export, adapted to the existing green AutoGrand web shell.

## Added routes

- `GET /stock-reports`
- `GET /api/stock/reports/options`
- `GET /api/stock/reports/summary`
- `GET /api/stock/reports/balance`
- `GET /api/stock/reports/movements`

There are no POST, PUT, PATCH or DELETE routes in this module.

## Read-only guarantees

This step must not change:

- stock posting
- reversals
- correction documents
- stock movement journal write logic
- posted document lock behavior

The service only reads with SELECT queries and runtime table introspection. It does not call Prisma create/update/delete/upsert methods and does not use `$executeRaw`.

## UI behavior

The new `/stock-reports` page provides:

- period filter
- object/location filter when available
- item filter when available
- KPI cards for movement count, incoming, outgoing and negative stock risk
- balance grid by item/location
- latest movement grid
- negative-stock risk list
- high-activity list
- print action
- CSV export action

## Runtime data discovery

The service dynamically inspects the SQLite schema so it can sit safely over the current AutoGrand stock engine without requiring a Prisma schema migration.

It searches for the most likely stock movement table and maps common columns such as item, location, quantity, date, document number, status and movement type.

If a movement table is not detected, the API still responds safely with diagnostics and empty report rows rather than mutating data or crashing the UI.

## QA commands

```bash
node --check src/services/stock-reports-service.js
node --check src/routes/stock-reports-routes.js
node --check public/js/stock-reports.js
node scripts/check-step4.10-stock-reports.mjs
node scripts/smoke-step4.10-stock-reports.mjs
```

Optional HTTP smoke after starting the app:

```bash
AUTOGRAND_SMOKE_URL=http://localhost:3000 node scripts/smoke-step4.10-stock-reports.mjs
```

On Windows PowerShell:

```powershell
$env:AUTOGRAND_SMOKE_URL = "http://localhost:3000"
node scripts/smoke-step4.10-stock-reports.mjs
Remove-Item Env:\AUTOGRAND_SMOKE_URL
```
