# Checkpoint — Step 4.9.3 Stock Control Center Drilldown / Detail Inspector

Статус: clean changed-files patch за AutoGrand ERP V2.

## Версия

- Package version: `0.4.22`
- Description: `AutoGrand ERP V2 Step 4.9.3 Stock Control Center Drilldown Detail Inspector`

## Обхват

Step 4.9.3 добавя read-only Detail Inspector към Stock Control Center:

- `/stock-control-center/inspect`
- `/api/stock-control-center/inspect`

Inspector-ът е предназначен за drilldown от risk panel/filter към документ, движение, reversal/correction статус, operator checklist и safe actions.

## Safety гаранции

- Няма ръчно редактиране на stock movement journal.
- Няма delete на journal редове.
- Няма unlock на POSTED документи.
- Няма inline reversal.
- Step 4.8 posting/reversal логиката не се пипа.
- Correction/reversal остава през отделен stock adjustment/correction документ.

## Очаквани проверки след apply

```powershell
node --check .\src\services\stock-control-detail-inspector-service.js
node --check .\src\routes\stock-control-detail-inspector-routes.js
node --check .\public\js\ag-stock-control-detail-inspector.js
node .\scripts\step-4-9-3-stock-control-detail-inspector-smoke.cjs
npm run check
git status --short
```

## Suggested commit

```powershell
git add package.json package-lock.json src/server.js views/layouts/main.hbs public/css/styles.css public/js/ag-stock-control-detail-inspector.js src/services/stock-control-detail-inspector-service.js src/routes/stock-control-detail-inspector-routes.js views/pages/stock-control-detail-inspector.hbs scripts/step-4-9-3-stock-control-detail-inspector-smoke.cjs docs/steps/STEP_4_9_3_STOCK_CONTROL_CENTER_DRILLDOWN_DETAIL_INSPECTOR_BG.md docs/checkpoints/STEP_4_9_3_STOCK_CONTROL_CENTER_DRILLDOWN_DETAIL_INSPECTOR_CLEAN_EXPORT_BG.md
git commit -m "Add Step 4.9.3 stock control detail inspector"
git push origin main
```
