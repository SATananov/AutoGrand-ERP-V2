# Step 4.8.4 — Stock Adjustment Audit / Reversal Safety Layer

Тази стъпка добавя audit и safety слой върху вече завършените складови корекции.

## Moneta правило

- Старите складови движения не се трият.
- Складовият журнал не се редактира ръчно.
- POSTED документът остава заключен.
- Грешна POSTED корекция се неутрализира чрез нов обратен DRAFT документ.
- Всеки важен action се записва в audit trail.

## Добавено

- `ag_stock_adjustment_audit` runtime-safe SQLite таблица.
- reason code слой за audit събития.
- audit API за документ.
- reversal preview API.
- reversal draft API.
- UI панел за audit и reversal safety.
- smoke script за Step 4.8.4.

## Важно

Step 4.8.4 не редактира реалния stock movement журнал. Обратната корекция е нов документ, който може отделно да мине DRAFT -> POSTED.
