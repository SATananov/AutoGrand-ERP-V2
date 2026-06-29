# Step 4.9.3 — Stock Control Center Drilldown / Detail Inspector

## Цел

Този step добавя Moneta-like drilldown слой към Stock Control Center: от risk panel, filter или document/journal ред операторът може да отвори read-only Detail Inspector.

Inspector-ът показва:

- document summary;
- stock movement trace;
- reversal/correction status;
- operator checklist;
- safe actions към документ, stock correction/adjustment поток и audit view.

## Moneta-like логика

Референтният Moneta runtime ZIP показва модулна ERP логика около browse/card/journal/action patterns. Step 4.9.3 следва същия принцип:

1. risk/filter/browse ред води към detail inspector;
2. detail inspector не редактира journal;
3. POSTED/locked документ не се отключва;
4. reversal/correction се прави през отделен документ;
5. операторът вижда trace и checklist преди действие.

## Добавени файлове

- `src/services/stock-control-detail-inspector-service.js`
- `src/routes/stock-control-detail-inspector-routes.js`
- `views/pages/stock-control-detail-inspector.hbs`
- `public/js/ag-stock-control-detail-inspector.js`
- `scripts/step-4-9-3-stock-control-detail-inspector-smoke.cjs`
- `docs/steps/STEP_4_9_3_STOCK_CONTROL_CENTER_DRILLDOWN_DETAIL_INSPECTOR_BG.md`
- `docs/checkpoints/STEP_4_9_3_STOCK_CONTROL_CENTER_DRILLDOWN_DETAIL_INSPECTOR_CLEAN_EXPORT_BG.md`

## Променени файлове чрез apply script

- `src/server.js` — добавя route import и mount;
- `views/layouts/main.hbs` — добавя browser enhancement script;
- `views/pages/stock-control-center.hbs`, ако съществува — добавя backup entry point към inspector-а;
- `public/css/styles.css` — добавя Step 4.9.3 CSS block;
- `package.json` и `package-lock.json` — version `0.4.22`.

## Безопасност

Step 4.9.3 е read-only слой. Той не добавя:

- директна редакция на `stock movement journal`;
- delete на journal редове;
- unlock на POSTED документи;
- inline reversal;
- промени в Step 4.8 posting/reversal ядро.

Всички correction/reversal действия остават през отделен stock adjustment/correction документ.

## Проверки

```powershell
node --check .\src\services\stock-control-detail-inspector-service.js
node --check .\src\routes\stock-control-detail-inspector-routes.js
node --check .\public\js\ag-stock-control-detail-inspector.js
node .\scripts\step-4-9-3-stock-control-detail-inspector-smoke.cjs
npm run check
```

## Ръчен QA

1. Отвори `/stock-control-center`.
2. Натисни `Инспектор` от risk/filter/document ред, ако е наличен.
3. Провери `/stock-control-center/inspect`.
4. Провери `/api/stock-control-center/inspect`.
5. Потвърди, че safe actions не предлагат директна journal редакция.
6. Потвърди, че POSTED документите остават locked.
