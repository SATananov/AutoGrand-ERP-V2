# Step 4.11 — Stock Valuation / Inventory Cost View Foundation

## Purpose

Step 4.11 adds a read-only inventory valuation layer over the existing stock movement data. It introduces a new AutoGrand green Moneta-like module for stock value, estimated unit cost, cost coverage and location value snapshots.

The module is intentionally separated from Stock Reports. It does not post, reverse, correct, edit or delete stock journal data.

## Added routes

- `GET /stock-valuation`
- `GET /api/stock/valuation/options`
- `GET /api/stock/valuation/summary`
- `GET /api/stock/valuation/balance`
- `GET /api/stock/valuation/movements-cost`
- `GET /api/stock/valuation/snapshot`

## Added files

- `src/services/stock-valuation-service.js`
- `src/routes/stock-valuation-routes.js`
- `views/pages/stock-valuation.hbs`
- `public/js/stock-valuation.js`
- `public/css/stock-valuation.css`
- `scripts/check-step4.11-stock-valuation.mjs`
- `scripts/smoke-step4.11-stock-valuation.mjs`

## Valuation approach

The service performs read-only SQLite/Prisma schema discovery and searches for stock movement, item and location tables. It then attempts to identify quantity, item, location, date, document and cost/value columns.

Supported cost view modes:

- Weighted average price
- Last incoming/unit price
- Movement value based price

If no cost or value column is detected, the row is still displayed with a missing-cost confidence flag. This is deliberate: the module must surface data quality without inventing accounting values.

## Safety rules preserved

- No `POST`, `PUT`, `PATCH` or `DELETE` stock valuation routes are added.
- No direct stock journal edit/delete operation is added.
- No posting, reversal, correction or stock movement journal logic is modified.
- POSTED document lock behavior remains untouched.
- Service logic uses read-only `SELECT` and `PRAGMA` discovery queries only.

## Checks

```bash
node --check src/services/stock-valuation-service.js
node --check src/routes/stock-valuation-routes.js
node --check public/js/stock-valuation.js
node --check scripts/check-step4.11-stock-valuation.mjs
node --check scripts/smoke-step4.11-stock-valuation.mjs
node scripts/check-step4.11-stock-valuation.mjs
node scripts/smoke-step4.11-stock-valuation.mjs
```
