# Clean Export — Step 2.6 Stock Module Foundation

## Съдържание

Този checkpoint добавя първата реална складова основа върху AutoGrand ERP V2 Desktop Shell.

## Нови ключови файлове

- `src/services/stock-actions-service.js`
- `views/pages/stock-dashboard.hbs`
- `views/pages/stock-adjustment-new.hbs`
- `views/pages/stock-transfer-new.hbs`
- `views/pages/stock-item-card.hbs`
- `views/pages/stock-warehouse-card.hbs`
- `docs/steps/STEP_2_6_STOCK_MODULE_FOUNDATION_BG.md`
- `docs/checkpoints/STEP_2_6_STOCK_MODULE_FOUNDATION_CLEAN_EXPORT_BG.md`

## Променени файлове

- `package.json`
- `src/server.js`
- `src/data/navigation.js`
- `src/services/core-data-service.js`
- `views/pages/screen-browse.hbs`
- `public/js/app.js`
- `public/css/styles.css`
- `scripts/check-project.mjs`
- `scripts/seed-prisma.js`

## Забележки

- Няма нова Prisma migration.
- Използват се наличните `StockBalance` и `StockMovement` таблици.
- Бизнес веригата вече е: продажби, доставки, stock IN/OUT, наличности, складови карти, корекции и трансфери.
