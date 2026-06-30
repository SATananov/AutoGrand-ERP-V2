# Checkpoint — Step 4.13.4 Purchase Draft Preparation / Manual Procurement Handoff

Версия: `0.4.47`

## Статус

Clean checkpoint за read-only handoff подготовка към Purchase Planning.

## Проверки

Очаквани проверки:

```powershell
node scripts/step-4-13-4-purchase-draft-preparation-handoff-smoke.cjs
node scripts/step-4-13-3-purchase-planning-detail-inspector-smoke.cjs
node scripts/step-4-13-2-purchase-planning-ui-polish-smoke.cjs
node scripts/step-4-13-purchase-planning-smoke.cjs
node scripts/step-4-13-1-login-screen-polish-smoke.cjs
npm run check
node --check src/server.js
```

## Обхват

- Purchase Planning manual handoff UI
- Supplier handoff route/API
- Read-only draft preparation model
- Windows-safe smoke imports запазени чрез `pathToFileURL`

## Не е променяно

- Prisma schema
- Seed данни
- Stock posting
- Reversal/correction logic
- Purchase document creation workflow
