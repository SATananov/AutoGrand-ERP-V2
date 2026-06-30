# Step 4.13.4 — Purchase Planning Purchase Draft Preparation / Manual Procurement Handoff

Версия: `0.4.47`

## Цел

Step 4.13.4 добавя read-only handoff слой към Purchase Planning. Той подготвя управленски пакет за ръчно въвеждане на purchase документ, базиран на supplier recommendation drilldown от Step 4.13.3.

## Добавено

- `/purchase-planning/suppliers/:supplierKey/handoff`
- `/api/purchase-planning/suppliers/:supplierKey/handoff`
- `purchaseDraftPreparation` модел в `purchase-planning-service.js`
- draft header полета: тип документ, доставчик, източник и състояние
- draft lines за ръчно копиране към purchase документ
- copy block за оператор
- manual checklist за критични редове, бюджет, цена и ръчно въвеждане
- CSS polish `ag-step-4134`
- smoke check `scripts/step-4-13-4-purchase-draft-preparation-handoff-smoke.cjs`

## Guardrails

- Handoff пакетът не е purchase документ.
- Няма автоматично създаване на purchase header или lines.
- Няма delivery/supplier invoice auto creation.
- Няма stock posting, reversal, correction или journal mutation.
- Операторът въвежда документа ръчно след човешко одобрение.

## Бележки

Step 4.13.4 използва съществуващите Inventory Planning supplier recommendations. Prisma schema и seed данните не се променят.
