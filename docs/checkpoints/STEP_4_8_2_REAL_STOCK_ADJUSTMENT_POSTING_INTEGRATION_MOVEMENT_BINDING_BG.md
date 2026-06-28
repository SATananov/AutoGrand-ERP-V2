# Checkpoint — Step 4.8.2 Real Stock Adjustment Posting Integration / Movement Binding

## Статус

Step 4.8.2 добавя реален movement binding слой към persistent stock adjustment документите.

## Променени файлове

- `src/data/stock-adjustment-foundation.js`
- `src/services/stock-adjustment-movement-binding-service.js`
- `src/services/stock-adjustment-persistence-service.js`
- `src/services/stock-adjustment-service.js`
- `src/routes/stock-adjustment-routes.js`
- `views/pages/stock-adjustments.hbs`
- `public/css/styles.css`
- `scripts/step-4-8-2-stock-adjustment-movement-binding-smoke.cjs`
- `docs/steps/STEP_4_8_2_REAL_STOCK_ADJUSTMENT_POSTING_INTEGRATION_MOVEMENT_BINDING_BG.md`
- `docs/checkpoints/STEP_4_8_2_REAL_STOCK_ADJUSTMENT_POSTING_INTEGRATION_MOVEMENT_BINDING_BG.md`

## Основна логика

- DRAFT документ остава editable.
- POSTED документ остава locked.
- POST използва реална таблица за складови движения.
- Ако binding липсва, POST отказва безопасно.
- Posting log пази връзката document line към movement id.
- Повторен POST е idempotent и не създава втори movement запис.

## API

- `GET /api/stock/adjustments/movement-binding`
- `POST /api/stock/adjustments/documents/:id/post`
- съществуващите Step 4.8.1 endpoints остават съвместими.

## Проверки

След apply се очаква:

- `npm run check` да мине.
- `node scripts/step-4-8-1-stock-adjustment-smoke.cjs` да мине.
- `node scripts/step-4-8-2-stock-adjustment-movement-binding-smoke.cjs` да мине.
- scoped encoding scan да мине.
