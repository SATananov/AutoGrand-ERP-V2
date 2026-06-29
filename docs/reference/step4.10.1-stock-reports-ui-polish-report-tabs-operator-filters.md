# Step 4.10.1 — Stock Reports UI Polish / Report Tabs / Operator Filters

## Purpose

Step 4.10.1 polishes the Step 4.10 stock reports foundation into a more realistic AutoGrand ERP reporting screen. It keeps the module read-only and adds a Moneta-like browse/report workflow without copying Moneta 1:1.

## Added / changed

- Report tabs: `Преглед`, `Наличности`, `Движения`, `Рискове`.
- Operator filter based on the detected stock movement user/operator column when available.
- Quick period buttons: 7 days, 30 days, 90 days, current month, current year.
- Client-side search over item, location, document, type and operator labels.
- Report mode selector: all rows, negative rows, zero balance, active rows.
- Overview panel with current filter summary and diagnostics.
- Row counters for balance and movement grids.
- CSV export respects the active report tab.
- Additional static check and smoke script for Step 4.10.1.

## Safety rules preserved

- No POST/PUT/PATCH/DELETE routes are added.
- No direct stock journal edit/delete operation is added.
- No stock posting, reversal, correction or movement journal logic is modified.
- POSTED document lock behavior remains untouched.
- Service uses read-only raw SELECT/PRAGMA discovery and existing GET endpoints.

## Routes remain read-only

- `GET /stock-reports`
- `GET /api/stock/reports/options`
- `GET /api/stock/reports/summary`
- `GET /api/stock/reports/balance`
- `GET /api/stock/reports/movements`

## Checks

```bash
node --check src/services/stock-reports-service.js
node --check src/routes/stock-reports-routes.js
node --check public/js/stock-reports.js
node --check scripts/check-step4.10.1-stock-reports-polish.mjs
node --check scripts/smoke-step4.10.1-stock-reports-polish.mjs
node scripts/check-step4.10.1-stock-reports-polish.mjs
node scripts/smoke-step4.10.1-stock-reports-polish.mjs
```
