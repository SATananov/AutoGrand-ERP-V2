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
