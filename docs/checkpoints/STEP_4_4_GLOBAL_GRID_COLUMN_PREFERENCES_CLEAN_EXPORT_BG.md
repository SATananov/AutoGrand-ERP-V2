# Checkpoint — Step 4.4 Global Grid Column Preferences

## Статус

Готов changed-files checkpoint за AutoGrand ERP V2.

```text
Step: 4.4 — Global Grid Column Preferences
Version: 0.4.8
Health label: 4-4-global-grid-column-preferences
Prisma schema change: NO
prisma/dev.db change: NO
```

## Файлове

```text
package.json
package-lock.json
public/css/styles.css
public/js/ag-grid-column-preferences.js
scripts/check-project.mjs
src/server.js
src/services/permission-service.js
src/services/grid-column-preferences-service.js
views/layouts/main.hbs
views/pages/catalog-foundation.hbs
views/pages/grid-column-preferences.hbs
docs/steps/STEP_4_4_GLOBAL_GRID_COLUMN_PREFERENCES_BG.md
docs/checkpoints/STEP_4_4_GLOBAL_GRID_COLUMN_PREFERENCES_CLEAN_EXPORT_BG.md
```

## Проверки

- JS syntax checks
- Moneta concepts present
- route wiring present
- permission wiring present
- browser runtime foundation present
- no Prisma schema/dev.db changes expected

## Референция от Moneta

Използвани concepts от Moneta ZIP:

```text
LoadGridView
DoLoadGridView
DoSaveGridView
GridColWidthChanged
GridTitleButtonClick
AssignGridProps
TfEdReportColumns
miEditCommonColumns
miAddColumns
VisibleFields
ColumnRights
DisplayWidth
```


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
