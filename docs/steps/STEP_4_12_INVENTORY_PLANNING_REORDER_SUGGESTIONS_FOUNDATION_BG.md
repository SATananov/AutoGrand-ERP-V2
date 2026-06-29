# Step 4.12 — Inventory Planning / Reorder Suggestions Foundation

Статус: foundation patch.

## Цел

Step 4.12 добавя read-only слой за планиране на наличности. Модулът е decision-support екран за мениджърски преглед, а не документен engine.

## Какво добавя

- страница `/inventory-planning`;
- API `/api/stock/inventory-planning` и alias `/api/inventory-planning`;
- service `src/services/inventory-planning-service.js`;
- минимални количества и projected available quantity;
- предложения за дозареждане;
- бавнодвижещи се артикули;
- риск от изчерпване;
- manager planning snapshot;
- smoke check `scripts/step-4-12-inventory-planning-smoke.cjs`.

## Moneta ориентир

При оглед на качения Moneta ZIP се виждат складови концепции като `InventoryPackage`, `TfInventorySetup`, `TfItemJournal`, `TfPhysInventoryJournal`, `TfRevaluationJournal`, `R_StockKeepingUnits`, `GetFreeQtyByBG`, `QtyToReceive`, `QtyToShip`, `BlockedQty`, `prtQTYCompanyStore`, `prtQTYBGStore` и `prtQTYOrdered`.

AutoGrand не копира Moneta 1:1. Step 4.12 взема като ERP ориентир идеята за складова настройка, свободна наличност, поръчано количество, резервирано/блокирано количество и журнална история, но ги използва само за read-only планиране.

## Guardrails

- няма автоматично създаване на документи;
- не се пипа stock posting;
- не се пипа reversal;
- не се пипа correction;
- не се пипа stock movement journal logic;
- няма директна редакция или изтриване на stock journal;
- POSTED документи остават locked.

## Следваща логична стъпка

Step 4.12.1 може да свърже planning threshold-ите с реални item/location настройки, ако в бъдещ модул се добави управляван екран за минимални/максимални количества. Това не трябва да отключва автоматично създаване на документи.
