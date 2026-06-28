# Checkpoint — Step 4.7.2 Stock Hardening PS 5.1 Route Repair

Step 4.7.2 поправя apply script-а на Step 4.7.1 и прилага route repair без PowerShell parser риск.

Очакван резултат:

- Apply script-ът стартира без parser error.
- `/api/stock/hardening/ping` връща `ok: true`.
- `/stock-hardening` зарежда зелената AutoGrand audit страница вместо 404/blank shell.
- Няма raw син линк „Складов контрол“ в работната зона.
