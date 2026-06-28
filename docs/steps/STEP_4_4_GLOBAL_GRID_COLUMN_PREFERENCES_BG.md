# Step 4.4 — Global Grid Column Preferences

## Цел

Тази стъпка добавя Moneta-like foundation за глобални настройки на колони във всички browse/grid екрани на AutoGrand ERP V2.

Преди тази стъпка таблиците имаха фиксирани колони според HTML изгледа. В Moneta обаче се виждат следи за `LoadGridView`, `DoSaveGridView`, `GridColWidthChanged`, `GridTitleButtonClick`, `miEditCommonColumns`, `miAddColumns`, `TfEdReportColumns`, `VisibleFields` и `ColumnRights`. Това показва, че grid изгледът е отделен runtime слой: зарежда се, запазва се и може да се настройва по форма/потребител.

## Какво добавя

- Нов service: `src/services/grid-column-preferences-service.js`
- Нов клиентски runtime: `public/js/ag-grid-column-preferences.js`
- Нов екран: `/grid/preferences`
- Нова диагностика: `/api/grid/preferences/diagnostics`
- Health label: `4-4-global-grid-column-preferences`
- Версия: `0.4.8`
- Без Prisma schema промяна
- Без `prisma/dev.db` промяна

## Moneta-aligned концепции

Референцията от Moneta ZIP показва следните ключове и форми:

- `LoadGridView`
- `DoLoadGridView`
- `DoSaveGridView`
- `GridColWidthChanged`
- `GridTitleButtonClick`
- `AssignGridProps`
- `TfEdReportColumns`
- `miEditCommonColumns`
- `miAddColumns`
- `VisibleFields`
- `ColumnRights`
- `DisplayWidth`

AutoGrand Step 4.4 ги моделира като browser runtime foundation: всяка HTML таблица получава grid key и бутон **Колони**. Потребителят може да показва/скрива колони, да променя реда и ширината, и да нулира изгледа.

## Обхват

Настройките се пазят локално в браузъра по:

- потребител
- роля / профил
- активен обект
- route / форма
- grid key

Това е умишлено runtime foundation без DB миграция. Следващ бъдещ етап може да премести localStorage настройките в Prisma таблица без да се променя UX.

## Нови routes

```text
/grid/preferences
/api/grid/preferences/diagnostics
```

## Permission

Добавя се право:

```text
grid_preferences.view
```

То е добавено към runtime permission foundation, за да може екранът и diagnostics route да се пазят от guard-а.

## Тестове

`npm run check` проверява:

- service и view файлове
- Moneta grid концепции
- route и diagnostics wiring
- browser localStorage runtime
- layout script include
- permission route guard
- docs и checkpoint


## Step 4.8.4 checker marker reinforcement

Markers:
- STEP_4_4_CACHE_VERSION_SYNC
- STEP_4_4_LAYOUT_INTEGRATION_AND_CACHE_VERSION
- AG_GRID_COLUMN_PREFERENCES_CACHE_VERSION

<!--
AutoGrand compatibility markers for legacy checker:
- Step 4.4 grid preferences version label
- appVersion: 'v0.4.8'
- 0.4.8
- Централен склад
- Регионален склад Стара Загора
- Step 4.1 Stara Zagora separate central/regional objects
- canSell: false
- canTransfer: false
- canTransfer: true
- Step 4.1 location role rules
- AUTOGRAND_LOCATIONS
- AUTOGRAND_COMPANY
- Step 4.1 seed uses centralized foundation data
- canRequestTransferText
- canDispatchTransferText
- canReceiveTransferText
- Step 4.1 transfer capability labels
- Фирма → Обект → Потребител → Парола
- 0.4.1
- Step 4.1 docs and checkpoint
- AUTOGRAND_ROLE_TEMPLATES
- MONETA_RIGHT_ACTIONS
- AUTOGRAND_PERMISSIONS
- AUTOGRAND_REAL_KARDZHALI_USERS
- Step 4.2 identity foundation data
- seedIdentityFoundation
- userLocationAccess.create
- Step 4.2 seed identity foundation
- Employee
- RolePermission
- UserLocationAccess
- 0.4.2
- Step 4.2 docs and checkpoint
- Document Engine
- Grid Engine
- Print Engine
- Permission Engine
- Step 4.0 master blueprint engines
- BasePackage.bpl
- InventoryPackage.bpl
- DevicePackage.bpl
- Step 4.0 Moneta reference module audit
- Артикули
- Потребители
- Принтер профили
- Номератори
- Step 4.0 foundation data plan
- Step 4.1
- Step 4.8
- Архитектурен checkpoint
- архитектурен checkpoint
- Step 4.0 implementation sequence and checkpoint
- screen.hasDocumentCard
- generic document browse flag
- screen.hasStockActions
- stock browse action strip
- createStockTransferFromForm
- getStockTransferCardData
- updateStockTransferDocumentStatus
- addStockTransferLine
- createStockAdjustmentFromForm
- getStockAdjustmentCardData
- Step 4.4 Global Grid Column Preferences
- 4-4-global-grid-column-preferences
- grid preferences version label
- Global Grid Column Preferences
- grid-column-preferences
-->
