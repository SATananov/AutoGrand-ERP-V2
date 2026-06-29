# Step 4.10.2 — Stock Reports Drilldown / Item Ledger / Location Movement Inspector

## Purpose

Step 4.10.2 extends the read-only Stock Reports module with drilldown-level ERP inspection. It keeps the Step 4.10/4.10.1 reporting foundation and adds an item ledger plus a location movement inspector in the AutoGrand green Moneta-like style.

## Added / changed

- New read-only endpoint: `GET /api/stock/reports/item-ledger`.
- New read-only endpoint: `GET /api/stock/reports/location-movements`.
- Item ledger tab: chronological movement card with running balance, balance before/after, document label and operator.
- Location inspector tab: item activity summary for selected location plus recent movement trace.
- Drilldown buttons from balance rows and movement rows: `Карта` and `Обект`.
- Source document link label points back to the Stock Control Center with document query parameters when document identifiers exist.
- CSV export now supports item ledger and location inspector tabs.
- Additional static check and smoke scripts for Step 4.10.2.

## Safety rules preserved

- No `POST`, `PUT`, `PATCH` or `DELETE` stock reports routes are added.
- No direct stock journal edit/delete operation is added.
- No posting, reversal, correction or stock movement journal logic is modified.
- POSTED document lock behavior remains untouched.
- Service logic uses read-only `SELECT`/`PRAGMA` discovery and existing GET endpoints only.

## Routes

- `GET /stock-reports`
- `GET /api/stock/reports/options`
- `GET /api/stock/reports/summary`
- `GET /api/stock/reports/balance`
- `GET /api/stock/reports/movements`
- `GET /api/stock/reports/item-ledger`
- `GET /api/stock/reports/location-movements`

## Checks

```bash
node --check src/services/stock-reports-service.js
node --check src/routes/stock-reports-routes.js
node --check public/js/stock-reports.js
node --check scripts/check-step4.10.2-stock-reports-drilldown.mjs
node --check scripts/smoke-step4.10.2-stock-reports-drilldown.mjs
node scripts/check-step4.10.2-stock-reports-drilldown.mjs
node scripts/smoke-step4.10.2-stock-reports-drilldown.mjs
```
