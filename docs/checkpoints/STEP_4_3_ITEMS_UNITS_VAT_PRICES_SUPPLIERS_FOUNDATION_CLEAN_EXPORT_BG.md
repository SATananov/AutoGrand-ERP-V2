# Clean Export Checkpoint — Step 4.3

## Име

Step 4.3 — Items, Units, VAT, Prices and Suppliers Foundation

## Версия

`0.4.7`

## Health label

`4-3-items-units-vat-prices-suppliers-foundation`

## Обхват

Moneta-aligned номенклатурна основа за артикули, мерни единици, ДДС, цени, контрагенти доставчици, supplier item codes и price history foundation.

## Променени файлове

- `package.json`
- `package-lock.json`
- `public/css/styles.css`
- `scripts/check-project.mjs`
- `src/server.js`
- `src/services/permission-service.js`
- `views/layouts/main.hbs`
- `src/data/autogrand-catalog-foundation.js`
- `src/services/catalog-foundation-service.js`
- `views/pages/catalog-foundation.hbs`
- `docs/steps/STEP_4_3_ITEMS_UNITS_VAT_PRICES_SUPPLIERS_FOUNDATION_BG.md`
- `docs/checkpoints/STEP_4_3_ITEMS_UNITS_VAT_PRICES_SUPPLIERS_FOUNDATION_CLEAN_EXPORT_BG.md`

## Moneta-aligned понятия

- `N_Item`
- `N_ItemCategory`
- `N_ItemProductGroup`
- `N_ItemProductClass`
- `TfEdItemTemplate`
- `R_ItemUnitOfMeasure`
- `G_VATPostingSetup`
- `VATBus_PostingGroup`
- `VATProd_PostingGroup`
- `N_Contragent`
- `N_ItemCrossRef`
- `N_ItemUnitPriceHistory`

## Проверки

- JS syntax checks за новите/променените JS файлове
- service smoke check за diagnostics counters
- `scripts/check-project.mjs` пази Step 4.3 структурата
- няма Prisma schema промяна
- няма `prisma/dev.db` промяна

## Следваща master-plan стъпка

Step 4.4 — Global Grid Column Preferences
