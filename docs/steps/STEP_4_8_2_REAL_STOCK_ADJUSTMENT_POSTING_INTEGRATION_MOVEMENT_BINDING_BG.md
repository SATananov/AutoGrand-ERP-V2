# Step 4.8.2 — Real Stock Adjustment Posting Integration / Movement Binding

## Цел

Тази стъпка свързва документа за складова корекция с реалния слой за складови движения. Step 4.8.1 даде постоянен документ и POSTED lock. Step 4.8.2 добавя по-строг binding adapter, който търси съществуваща таблица за stock movement и записва корекционното движение там.

## Moneta логика

- Старите складови движения не се трият.
- Складовият журнал не се редактира ръчно.
- Корекцията минава през отделен документ.
- DRAFT документ може да се редактира.
- POSTED документ се заключва.
- Реалният ефект се записва като ново движение в съществуващия movement слой.
- Повторен POST не създава второ движение за същия ред.

## Какво добавя Step 4.8.2

- Нов binding service: `src/services/stock-adjustment-movement-binding-service.js`.
- API диагностика: `/api/stock/adjustments/movement-binding`.
- POST логика с explicit binding profile и movement trace.
- Posting log разширение с `movement_direction`, `binding_profile`, `binding_score`, `source_type`, `posted_by`.
- UI панел за активния stock movement binding.
- Smoke test: `scripts/step-4-8-2-stock-adjustment-movement-binding-smoke.cjs`.

## Защити

Ако не бъде открита реална таблица за складови движения, POST операцията спира безопасно. Това е умишлено, защото AutoGrand ERP V2 не трябва да симулира складов журнал в shadow таблица.

## Очакван workflow

1. Създава се DRAFT документ.
2. Добавят се редове с текущо и преброено количество.
3. При POST се изчислява `deltaQuantity`.
4. За всеки non-zero ред се записва ново stock movement движение.
5. Записва се trace в `ag_stock_adjustment_posting_log`.
6. Документът става POSTED и се заключва.

## Проверки

- `npm run check`
- `node scripts/step-4-8-1-stock-adjustment-smoke.cjs`
- `node scripts/step-4-8-2-stock-adjustment-movement-binding-smoke.cjs`
