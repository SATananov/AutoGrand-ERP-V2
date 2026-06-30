# Checkpoint — Step 4.13 Purchase Planning / Procurement Decision Center Foundation

## Статус

Clean checkpoint candidate за AutoGrand ERP V2 версия `0.4.43`.

## Добавени файлове

- `src/services/purchase-planning-service.js`
- `src/routes/purchase-planning-routes.js`
- `views/pages/purchase-planning.hbs`
- `scripts/step-4-13-purchase-planning-smoke.cjs`
- `docs/steps/STEP_4_13_PURCHASE_PLANNING_PROCUREMENT_DECISION_CENTER_FOUNDATION_BG.md`
- `docs/checkpoints/STEP_4_13_PURCHASE_PLANNING_PROCUREMENT_DECISION_CENTER_FOUNDATION_BG.md`

## Променени файлове

- `package.json`
- `package-lock.json`
- `src/server.js`
- `src/data/navigation.js`
- `src/services/permission-service.js`
- `public/css/styles.css`

## Runtime routes

- `/purchase-planning`
- `/procurement-decision-center`
- `/api/purchase-planning`
- `/api/procurement-decision-center`

## Проверки

- version sync: `0.4.43` в `package.json` и `package-lock.json`;
- service markers за Step 4.13;
- route markers за Step 4.13;
- view markers за procurement decision center;
- CSS markers за Step 4.13;
- navigation link в „Доставки“;
- permission rules към `purchase.view`;
- guardrails срещу automatic purchase creation и stock journal mutation;
- dynamic service import check с реално генериране на decision center snapshot.

## Guardrails

Step 4.13 остава read-only decision-support слой. Няма автоматично създаване на purchase документи, няма stock posting, няма reversal/correction и няма промяна на stock movement journal logic.
