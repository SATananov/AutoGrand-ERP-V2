# Checkpoint — Step 4.8.1 PowerShell 5.1 Safe Apply Repair

Ремонтен apply checkpoint за Step 4.8.

Очакван резултат:

- `/stock-adjustments` се отваря;
- `/api/stock/adjustments/ping` връща OK;
- `/api/stock/adjustments/foundation` връща foundation metadata;
- `/api/stock/adjustments/preview` може да изчисли ефект без запис в база;
- `npm run check` не пада заради JSON/BOM или PowerShell encoding проблем.
