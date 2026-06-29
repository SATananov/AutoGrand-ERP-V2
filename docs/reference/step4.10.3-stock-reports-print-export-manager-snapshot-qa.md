# Step 4.10.3 — Stock Reports Print / Export / Manager Snapshot QA

## Purpose

Step 4.10.3 finalizes the Stock Reports analytics layer with print/export polish and a manager-oriented read-only snapshot. It builds on Step 4.10.2 drilldown features and keeps the AutoGrand green Moneta-like reporting style.

## Added / changed

- New read-only endpoint: `GET /api/stock/reports/manager-snapshot`.
- New `Snapshot` report tab with manager cards, risk level, control notes, location summary and recent document trace.
- Print metadata for the selected period, active tab and generated timestamp.
- CSV export now supports manager snapshot/location summary output.
- Print CSS hides operational controls and keeps report panels readable.
- Additional static QA and smoke scripts for Step 4.10.3.

## Safety rules preserved

- No `POST`, `PUT`, `PATCH` or `DELETE` stock report routes are added.
- No direct stock journal edit/delete operation is added.
- No posting, reversal, correction or stock movement journal logic is modified.
- POSTED document lock behavior remains untouched.
- Service logic uses read-only `SELECT`/`PRAGMA` discovery and existing GET report endpoints only.

## Routes

- `GET /stock-reports`
- `GET /api/stock/reports/options`
- `GET /api/stock/reports/summary`
- `GET /api/stock/reports/balance`
- `GET /api/stock/reports/movements`
- `GET /api/stock/reports/item-ledger`
- `GET /api/stock/reports/location-movements`
- `GET /api/stock/reports/manager-snapshot`

## Checks

```bash
node --check src/services/stock-reports-service.js
node --check src/routes/stock-reports-routes.js
node --check public/js/stock-reports.js
node --check scripts/check-step4.10.3-stock-reports-print-export-snapshot.mjs
node --check scripts/smoke-step4.10.3-stock-reports-print-export-snapshot.mjs
node scripts/check-step4.10.3-stock-reports-print-export-snapshot.mjs
node scripts/smoke-step4.10.3-stock-reports-print-export-snapshot.mjs
```
