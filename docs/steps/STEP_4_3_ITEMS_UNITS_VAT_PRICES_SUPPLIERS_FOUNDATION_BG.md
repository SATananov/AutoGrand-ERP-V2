# Step 4.3 — Items, Units, VAT, Prices and Suppliers Foundation

## Цел

Тази стъпка добавя Moneta-aligned номенклатурна основа за AutoGrand ERP V2, без да въвежда още Prisma schema промяна. Целта е да имаме правилни понятия и стабилен визуален/диагностичен екран преди реалната база за артикули, мерни единици, ДДС, цени и контрагенти.

## Защо не е просто “групи артикули”

От Moneta reference ZIP-а се виждат понятия като:

- `N_Item`
- `N_ItemCategory`
- `N_ItemProductGroup`
- `N_ItemProductClass`
- `TfEdItemTemplate`
- `R_ItemUnitOfMeasure`
- `Measure_Id`, `PurchMeasure`, `QtyPerUnitOfMeasure`
- `G_VATPostingSetup`
- `VATBus_PostingGroup`
- `VATProd_PostingGroup`
- `VATPercent`, `VATCalculationType`, `PriceIncludingVAT`
- `N_Contragent`
- `N_ItemCrossRef`
- `N_ItemUnitPriceHistory`

Затова AutoGrand foundation-ът вече моделира каталога като Moneta-like master-data слой, а не като плосък списък.

## Добавено

- `src/data/autogrand-catalog-foundation.js`
  - артикули (`N_Item` style)
  - категории (`N_ItemCategory`)
  - продуктови групи (`N_ItemProductGroup`)
  - продуктови класове (`N_ItemProductClass`)
  - шаблони (`TfEdItemTemplate`)
  - мерки и доставни мерки (`Measure_Id`, `PurchMeasure`)
  - преобразувания (`R_ItemUnitOfMeasure`, `QtyPerUnitOfMeasure`)
  - ДДС бизнес групи (`VATBus_PostingGroup`)
  - ДДС продуктови групи (`VATProd_PostingGroup`)
  - ДДС setup (`G_VATPostingSetup`)
  - ценови нива (`TfEdPrices`, `TfBrPriceList`)
  - контрагенти доставчици (`N_Contragent`)
  - supplier item codes (`N_ItemCrossRef`)
  - цена история (`N_ItemUnitPriceHistory`)

- `src/services/catalog-foundation-service.js`
  - изгражда view model за UI
  - обогатява артикули с група, клас, шаблон, ДДС, доставчик и supplier code
  - връща diagnostics JSON

- `views/pages/catalog-foundation.hbs`
  - Moneta concepts chips
  - карти за обобщение
  - мерни единици
  - ДДС продуктови групи
  - ДДС posting setup
  - категории и продуктови групи
  - контрагенти доставчици
  - мерни преобразувания
  - foundation артикули

## Routes

- `/catalog/foundation`
- `/api/catalog/foundation/diagnostics`

## Permissions

Добавят се/използват се:

- `catalog.view`
- `catalog.edit`

Това е само foundation/diagnostics слой. Реалните CRUD екрани за артикули и контрагенти ще дойдат след глобалните grid/document engines.

## Важно

Няма Prisma schema промяна и няма `prisma/dev.db` промяна. Данните са статични foundation записи, за да не заключим грешна структура преди глобалния document/grid слой.
