# Checkpoint — Step 4.12.3 Inventory Planning Supplier / Purchase Recommendation View

## Цел

Step 4.12.3 добавя read-only supplier / purchase recommendation изглед върху Inventory Planning слоя.

Модулът групира reorder нуждите по доставчик и показва:

- доставчици с препоръки за покупка;
- критични доставчици за ръчен преглед;
- ориентировъчна стойност за покупка;
- редове за покупка по артикул;
- разрез по складове и групи;
- manager snapshot и ръчни next steps.

## Нови екрани

- `/inventory-planning/suppliers`
- `/inventory-planning/suppliers/:supplierKey`

## Нови API endpoints

- `/api/stock/inventory-planning/suppliers`
- `/api/inventory-planning/suppliers`
- `/api/stock/inventory-planning/suppliers/:supplierKey`
- `/api/inventory-planning/suppliers/:supplierKey`

## Guardrails

- Няма автоматично създаване на purchase документи.
- Няма stock posting промяна.
- Няма reversal/correction промяна.
- Няма директна редакция или изтриване на stock movement journal.
- POSTED документи остават locked.
- Това е decision-support view за мениджърско решение.

## Checks

Apply script-ът изпълнява:

- `node --check` за service/routes/smoke/server;
- encoding scan за подозрителни encoding маркери;
- `npm run check`;
- `node scripts/step-4-12-3-inventory-planning-supplier-purchase-smoke.cjs`.

## Версия

`0.4.39`


Clean export checkpoint се създава след commit/push чрез `create_step_4_12_3_clean_export_checkpoint.ps1`.
