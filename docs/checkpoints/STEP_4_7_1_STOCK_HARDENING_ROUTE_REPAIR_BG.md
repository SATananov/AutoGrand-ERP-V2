# Checkpoint — Step 4.7.1 Stock Hardening Route Repair

Step 4.7.1 поправя зареждането на Step 4.7 страницата в Moneta-like shell.

Очакван резултат:

- `/stock-hardening` показва зелен AutoGrand audit екран.
- Вече няма raw син линк „Складов контрол“ в работната зона.
- `/api/stock/hardening/ping` връща `{ ok: true }`.
- `/api/stock/hardening/audit` връща audit JSON или безопасна диагностика.
