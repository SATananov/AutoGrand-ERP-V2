# Step 4.8.5 — Stock Adjustment Final Polish / Operator Workflow Hardening

## Цел

Тази стъпка добавя финален операторски слой върху складовите корекции, без да променя вече работещото ядро от Step 4.8.1–4.8.4.

## Moneta логика

- DRAFT документът остава подготвителен и редактируем.
- POSTED документът остава заключен.
- Старите складови движения не се трият.
- Складовият журнал не се редактира ръчно.
- Грешна POSTED корекция се оправя само чрез нов обратен документ.
- Операторът трябва да вижда ясно кои действия са разрешени и кои са блокирани.

## Какво добавя

- операторски action profile за DRAFT и POSTED;
- safety checklist;
- reason guide за корекционни причини;
- helper за човешки съобщения при грешки;
- UI панел с кратки правила за работа;
- smoke script за Step 4.8.5 markers;
- документация и checkpoint.

## Засегнати файлове

- `src/data/stock-adjustment-operator-workflow-foundation.js`
- `src/services/stock-adjustment-operator-workflow-service.js`
- `src/data/stock-adjustment-foundation.js`
- `src/services/stock-adjustment-service.js`
- `views/pages/stock-adjustments.hbs`
- `public/css/styles.css`
- `scripts/step-4-8-5-stock-adjustment-operator-workflow-smoke.cjs`

## Проверки

- `node --check` върху новите JS файлове;
- `npm run check`;
- Step 4.8.1 smoke;
- Step 4.8.2 smoke;
- Step 4.8.3 smoke;
- Step 4.8.4 smoke;
- Step 4.8.5 smoke;
- scoped encoding scan.
