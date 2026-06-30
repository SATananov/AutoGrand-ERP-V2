# Step 4.13.2 — Purchase Planning UI Polish / Procurement Manager Dashboard Refinement

Версия: `0.4.45`

## Цел

Step 4.13.2 полира съществуващия read-only Purchase Planning / Procurement Decision Center и го превръща в по-ясен мениджърски dashboard за човешко procurement решение.

## Обхват

Добавени са:

- manager status strip с по-ясен decision фокус;
- филтри по procurement lane: всички, спешни, бюджет, готови, наблюдение;
- manager KPI panels за приоритет, бюджет, top supplier и manual workflow;
- recommendation mix секция за разпределение на supplier решенията;
- insight strip с decision фокус, supplier coverage и първи ред за преглед;
- supplier cards за най-важните доставчици;
- филтрирана supplier decision таблица;
- responsive CSS polish за manager dashboard изглед.

## Технически файлове

- `src/services/purchase-planning-service.js`
- `src/routes/purchase-planning-routes.js`
- `views/pages/purchase-planning.hbs`
- `public/css/styles.css`
- `src/server.js`
- `package.json`
- `package-lock.json`
- `scripts/step-4-13-2-purchase-planning-ui-polish-smoke.cjs`

## Guardrails

Този step остава read-only decision-support слой:

- няма автоматично създаване на purchase документ;
- няма delivery или supplier invoice auto creation;
- няма stock posting;
- няма reversal/correction;
- няма stock movement journal mutation;
- съществуващият purchase workflow остава ръчен.

## Проверки

```powershell
node scripts/step-4-13-2-purchase-planning-ui-polish-smoke.cjs
node scripts/step-4-13-purchase-planning-smoke.cjs
node scripts/step-4-13-1-login-screen-polish-smoke.cjs
npm run check
node --check src/server.js
```
