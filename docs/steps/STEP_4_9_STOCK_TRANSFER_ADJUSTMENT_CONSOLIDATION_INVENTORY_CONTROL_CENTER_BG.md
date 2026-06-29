# Step 4.9 — Stock Transfer / Adjustment Consolidation & Inventory Control Center

## Цел

Step 4.9 добавя контролен център за складовите операции, който обединява:

- складови трансфери;
- складови корекции;
- movement trace;
- audit / reversal safety;
- operator workflow правила;
- QA gate-ове за завършения Step 4.8 блок.

## Moneta логика

Контролният център е read-only consolidation слой. Той не променя стария складов журнал и не прави директни stock операции.

Правилата остават:

- старите движения не се трият;
- складовият журнал не се редактира ръчно;
- корекцията става чрез документ;
- POSTED документите са заключени;
- грешна POSTED корекция се оправя чрез нов reversal draft;
- операторът трябва да вижда trace/audit връзката.

## Нови файлове

- `src/data/stock-control-center-foundation.js`
- `src/services/stock-control-center-service.js`
- `src/routes/stock-control-center-routes.js`
- `views/pages/stock-control-center.hbs`
- `scripts/step-4-9-stock-control-center-smoke.cjs`
- `docs/checkpoints/STEP_4_9_STOCK_TRANSFER_ADJUSTMENT_CONSOLIDATION_INVENTORY_CONTROL_CENTER_BG.md`

## Нови маршрути

- `/stock-control-center`
- `/api/stock/control-center/ping`
- `/api/stock/control-center/foundation`
- `/api/stock/control-center/summary`

## QA

Step 4.9 добавя smoke проверка за:

- route registration;
- service/foundation markers;
- UI markers;
- sidebar link;
- package/server metadata;
- липса на mojibake в активните Step 4.9 файлове.
