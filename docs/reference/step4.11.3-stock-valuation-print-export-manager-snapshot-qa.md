# Step 4.11.3 — Stock Valuation Print / Export / Manager Snapshot QA

Final reporting polish for the read-only Stock Valuation module before closure.

## Added

- `GET /api/stock/valuation/manager-snapshot`
- Manager Snapshot QA tab
- Print metadata for valuation snapshot
- Manager cards for total value, risk value, cost coverage, missing cost, negative positions and high-value exposure
- Location control table with risk score
- Manager risk rows with click-through to Cost Inspector
- CSV export support for the manager snapshot tab
- Print CSS polish
- Step 4.11.3 check and smoke scripts

## Safety rules

- Read-only only.
- No POST/PUT/PATCH/DELETE valuation API routes.
- No stock journal edit/delete.
- No posting, reversal, correction or stock movement journal logic changes.
- POSTED documents remain locked.
