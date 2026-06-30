# Step 4.13 — Purchase Planning / Procurement Decision Center Foundation

Статус: foundation patch.

## Цел

Step 4.13 добавя read-only procurement decision center над вече завършения Inventory Planning / Supplier Recommendation слой. Екранът е управленски център за решение: кои доставчици са критични, кои редове са за първи преглед, какъв е ориентировъчният бюджет и каква е безопасната ръчна последователност преди purchase документ.

## Какво добавя

- страница `/purchase-planning`;
- alias страница `/procurement-decision-center`;
- API `/api/purchase-planning`;
- API alias `/api/procurement-decision-center`;
- service `src/services/purchase-planning-service.js`;
- routes `src/routes/purchase-planning-routes.js`;
- view `views/pages/purchase-planning.hbs`;
- navigation link в модул „Доставки“ — „Планиране на покупки“;
- permission route rules за `purchase.view`;
- procurement KPI cards, decision lanes, supplier workbench, selected supplier focus и top purchase lines;
- smoke check `scripts/step-4-13-purchase-planning-smoke.cjs`.

## Източник на данни

Step 4.13 използва Step 4.12.3 supplier recommendations чрез `getInventoryPlanningSupplierRecommendations()` и `getInventoryPlanningSnapshot()`.

Това означава, че Step 4.13 не въвежда нов posting engine, не пише в Prisma schema и не създава нови purchase/stock записи.

## UI поведение

- Procurement status strip показва общото състояние.
- KPI cards показват спешни доставчици, доставчици с покупка, ориентировъчна стойност, purchase редове и бюджетни прагове.
- Decision lanes разделят доставчиците на:
  - спешен преглед;
  - бюджетен контрол;
  - готово за ръчно решение;
  - наблюдение.
- Supplier decision workbench дава ред по доставчик с решение, стойност, budget band и линк към inventory supplier inspector.
- Top purchase lines показват първите редове за проверка.
- Upstream/downstream links водят към Inventory Planning, Supplier Planning и ръчно създаване на purchase документ.

## Guardrails

- няма автоматично създаване на purchase документ;
- няма автоматично създаване на delivery или supplier invoice;
- няма stock posting;
- няма reversal;
- няма correction;
- няма stock movement journal mutation;
- POSTED документите остават locked;
- purchase документът се създава само ръчно след човешко решение.

## Бележка за route mount

В този step route mount-овете за Stock Control Center, Inventory Planning и Purchase Planning са регистрирани преди 404 handler-а, за да останат реално достижими runtime екрани.

## Следваща логична стъпка

Step 4.13.1 може да полира procurement dashboard-а: филтри по supplier/budget/risk, по-компактни manager карти и по-силен operator workflow около ръчната покупка.
