# Step 4.8.3 — Stock Adjustment Posting UI / Movement Trace Visibility

## Цел

Step 4.8.3 добавя видим слой върху вече реализираното осчетоводяване на складови корекции от Step 4.8.2.

Фокусът е UI и trace:

- POSTED документът показва, че е заключен;
- виждат се movement trace редовете към реалния stock movement журнал;
- вижда се summary: брой движения, обща разлика, IN/OUT броячи;
- има отделен API endpoint за trace на конкретен документ;
- DRAFT документите остават без реален складов ефект.

## Moneta правило

Корекцията не редактира стария складов журнал. След POSTED документът е заключен, а ефектът се доказва чрез нови movement записи и видима следа към тях.

## Нов API

```text
GET /api/stock/adjustments/documents/:id/movement-trace
```

Връща:

- document metadata;
- traceSummary;
- movementTrace rows.

## UI

Страницата `/stock-adjustments` вече показва:

- POSTED lock panel;
- Movement trace visibility panel;
- summary cards;
- trace table с movement table, movement id, line id, direction, quantity delta, binding profile и posted by/time;
- reload trace бутон.

## Проверки

```powershell
npm run check
node scripts/step-4-8-1-stock-adjustment-smoke.cjs
node scripts/step-4-8-2-stock-adjustment-movement-binding-smoke.cjs
node scripts/step-4-8-3-stock-adjustment-movement-trace-visibility-smoke.cjs
```
