# Checkpoint — Step 4.8.4 Stock Adjustment Audit / Reversal Safety Layer

Step 4.8.4 добавя audit trail и безопасна обратна корекция за stock adjustment документа.

Проверки:

- `npm run check`
- `node scripts/step-4-8-1-stock-adjustment-smoke.cjs`
- `node scripts/step-4-8-2-stock-adjustment-movement-binding-smoke.cjs`
- `node scripts/step-4-8-3-stock-adjustment-movement-trace-visibility-smoke.cjs`
- `node scripts/step-4-8-4-stock-adjustment-audit-reversal-safety-smoke.cjs`

Очаквано поведение:

- DRAFT е editable.
- POSTED е locked.
- POSTED не се редактира и не се трие.
- Reversal не пипа стария journal, а създава нов DRAFT документ с обратни количества.
- Audit trail пази create/update/delete/post/idempotent/reversal събития.
