# Checkpoint — Step 4.8.3 Stock Adjustment Posting UI / Movement Trace Visibility

## Статус

Готов за apply върху чист Step 4.8.2 (`79f344c`).

## Съдържание

- добавя movement trace summary към stock adjustment document payload;
- добавя `GET /api/stock/adjustments/documents/:id/movement-trace`;
- добавя POSTED lock panel в `/stock-adjustments`;
- добавя movement trace visibility panel и таблица;
- добавя smoke script за Step 4.8.3.

## Защити

- не трие стари movements;
- не редактира stock journal ръчно;
- не променя Step 4.8.2 movement binding правилото;
- DRAFT документите остават без stock effect;
- POSTED документите остават locked.
