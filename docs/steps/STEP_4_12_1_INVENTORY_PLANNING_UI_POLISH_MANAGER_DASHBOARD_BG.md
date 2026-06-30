# Step 4.12.1 — Inventory Planning UI Polish / Manager Dashboard Refinement

## Цел

Step 4.12.1 надгражда вече затворения read-only слой за планиране на наличности с по-ясен мениджърски dashboard, KPI карти, filter chips, planning lanes, по-богата таблица и breakdown по складове/групи.

## Обхват

- Мениджърски command strip със статус и следващо ръчно действие.
- KPI карти за критичен риск, дозареждане, стойност за планиране, бавно движение, проектна наличност и текуща stock value.
- Filter chips: всички, риск, дозареждане, бавно движение, наблюдение, стабилни.
- Planning lanes за спешен риск, дозареждане и бавно движение.
- Разширена таблица с целево ниво, стойност, coverage label и ръчно действие.
- Breakdown по склад и по група.
- API остава read-only и поддържа `?view=` за dashboard филтриране.

## Guardrails

- Няма автоматично създаване на документи.
- Няма posting, reversal, correction или промяна на stock movement journal.
- Няма директна редакция или изтриване на stock journal.
- POSTED документите остават заключени.
- Модулът е decision-support layer, не operational posting layer.

## Routes

- `/inventory-planning`
- `/inventory-planning?view=critical`
- `/inventory-planning?view=reorder`
- `/inventory-planning?view=slow`
- `/api/stock/inventory-planning`
- `/api/inventory-planning`

## Версия

- package version: `0.4.37`
- health label: `4-12-1-inventory-planning-ui-polish-manager-dashboard`
