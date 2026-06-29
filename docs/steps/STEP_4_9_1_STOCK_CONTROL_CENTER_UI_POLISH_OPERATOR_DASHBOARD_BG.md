# Step 4.9.1 — Stock Control Center UI Polish / Operator Dashboard

## Цел

Step 4.9.1 надгражда вече въведения Step 4.9 Stock Control Center с по-ясна операторска повърхност. Тази стъпка не променя складовите движения, осчетоводяването, сторнирането или Step 4.8 логиката.

## Добавено

- по-ясен dashboard за складов контрол;
- cards за основните направления: трансфери, корекции, trace, audit/reversal safety;
- операторски checklist преди действие;
- QA indicators за route/API, operator surface и safety rules;
- timeline на затворения складов блок 4.8.x + 4.9;
- нов API endpoint за operator checklist;
- нов smoke test за Step 4.9.1.

## Moneta-safe правила

- Контролният център е read-only слой.
- Няма директна редакция на stock journal.
- Няма изтриване на posted движения.
- POSTED документите остават заключени.
- Корекция или сторно се прави чрез отделен документ.
- Трансферите и корекциите остават отделни документни типове.

## Файлове

- `src/data/stock-control-center-foundation.js`
- `src/services/stock-control-center-service.js`
- `src/routes/stock-control-center-routes.js`
- `views/pages/stock-control-center.hbs`
- `public/css/styles.css`
- `scripts/step-4-9-1-stock-control-center-ui-polish-smoke.cjs`

## Проверки

- `node --check` за новите JS файлове;
- `npm run check`;
- `node scripts/step-4-8-6-stock-adjustment-final-qa-clean-export-smoke.cjs`;
- `node scripts/step-4-9-stock-control-center-smoke.cjs`;
- `node scripts/step-4-9-1-stock-control-center-ui-polish-smoke.cjs`.
