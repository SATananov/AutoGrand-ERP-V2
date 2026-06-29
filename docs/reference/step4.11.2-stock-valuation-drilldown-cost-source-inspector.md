# Step 4.11.2 — Stock Valuation Drilldown / Cost Source Inspector

## Purpose
Adds a read-only drilldown layer to the Stock Valuation module.

## Added
- `GET /api/stock/valuation/item-ledger`
- `GET /api/stock/valuation/cost-source`
- Cost Source Inspector tab
- Click-through from valuation balance rows to item/location cost trace
- Running quantity/value ledger
- Cost source explanation and confidence summary
- CSV export for inspector ledger

## Safety
- No POST/PUT/PATCH/DELETE valuation routes.
- No stock journal edit/delete.
- No posting, reversal or correction logic changes.
- POSTED document locks remain unchanged.

## Base
Built on clean Step 4.11.1 commit `9f2c6e4`.
