# Step 4.12.2 — Inventory Planning Detail Inspector / Item Planning Drilldown

## Цел

Step 4.12.2 надгражда read-only Inventory Planning слоя с детайлен инспектор за артикул. Мениджърът може да отвори конкретен артикул от planning таблицата и да види защо системата го маркира като риск, за дозареждане, за наблюдение или slow-moving.

## Добавено

- Detail link от `/inventory-planning` към `/inventory-planning/item/:itemCode`.
- Read-only API drilldown:
  - `/api/stock/inventory-planning/items/:itemCode`
  - `/api/inventory-planning/items/:itemCode`
- Артикулов inspector view с:
  - текущ риск и приоритет;
  - наличност, резервирано, входящо и проектна наличност;
  - минимално количество и цел;
  - предложено количество и ориентировъчна стойност;
  - наличност по обекти;
  - последни движения / movement context;
  - planning signals;
  - ръчна manager recommendation;
  - свързани артикули от същата група.

## Guardrails

- Модулът остава read-only decision-support layer.
- Няма автоматично създаване на purchase, transfer или correction документ.
- Няма промяна в stock posting, reversal, correction или stock movement journal logic.
- Няма директна редакция или изтриване на stock journal.
- POSTED документи остават locked.

## Файлове

- `src/services/inventory-planning-service.js`
- `src/routes/inventory-planning-routes.js`
- `views/pages/inventory-planning.hbs`
- `views/pages/inventory-planning-item.hbs`
- `public/css/styles.css`
- `scripts/step-4-12-2-inventory-planning-detail-inspector-smoke.cjs`

## Проверки

Apply script-ът изпълнява:

- `node --check src/services/inventory-planning-service.js`
- `node --check src/routes/inventory-planning-routes.js`
- `node --check scripts/step-4-12-2-inventory-planning-detail-inspector-smoke.cjs`
- `node --check src/server.js`
- encoding scan за suspicious markers
- `npm run check`
- `node scripts/step-4-12-2-inventory-planning-detail-inspector-smoke.cjs`

## Версия

`0.4.38`
