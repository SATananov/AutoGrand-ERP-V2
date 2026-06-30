# Step 4.13.3 — Purchase Planning Detail Inspector / Supplier Recommendation Drilldown

Версия: `0.4.46`

## Цел

Step 4.13.3 надгражда Purchase Planning / Procurement Decision Center с детайлен read-only инспектор за доставчик. Екранът позволява на мениджър да отвори конкретен supplier recommendation drilldown преди ръчно създаване на purchase документ.

## Добавено

- нов route: `/purchase-planning/suppliers/:supplierKey`;
- нов API route: `/api/purchase-planning/suppliers/:supplierKey`;
- supplier detail inspector модел в `src/services/purchase-planning-service.js`;
- recommendation lines за избрания доставчик;
- warehouse breakdown и group breakdown;
- manual decision checklist;
- peer supplier links;
- `ag-step-4133` responsive CSS слой;
- smoke check `scripts/step-4-13-3-purchase-planning-detail-inspector-smoke.cjs`;
- Windows-safe smoke imports чрез `pathToFileURL`;
- render repair остава активен: `res.render("purchase-planning")`, защото Express views root е `views/pages`.

## Guardrails

- няма автоматично създаване на purchase документ;
- няма delivery или supplier invoice auto creation;
- няма stock posting;
- няма reversal/correction;
- няма stock movement journal mutation;
- recommendation редовете са snapshot за човешко решение и се въвеждат ръчно при одобрение.

## Проверки

```powershell
node scripts/step-4-13-3-purchase-planning-detail-inspector-smoke.cjs
node scripts/step-4-13-2-purchase-planning-ui-polish-smoke.cjs
node scripts/step-4-13-purchase-planning-smoke.cjs
node scripts/step-4-13-1-login-screen-polish-smoke.cjs
npm run check
node --check src/server.js
```
