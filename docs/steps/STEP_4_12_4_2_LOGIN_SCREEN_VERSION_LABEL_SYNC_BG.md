# Step 4.12.4.2 — Login Screen Version Label Sync

## Цел

Тази малка repair/polish стъпка синхронизира видимия version label на login/shell runtime UI с актуалната package версия на AutoGrand ERP V2.

## Обхват

- Версията се вдига до `0.4.42`.
- Старият видим надпис `v0.4.10` се заменя с `v0.4.42` в runtime view/public файловете, където е hardcoded.
- Добавя се smoke check за login/runtime version label.

## Guardrails

- Не се променя Prisma schema.
- Не се променя stock posting логика.
- Не се променя reversal/correction логика.
- Не се променя stock movement journal логика.
- Не се добавя автоматично създаване на purchase/stock документи.
- POSTED документите остават locked.

## Проверки

- `npm run check`
- `node scripts/step-4-12-4-2-login-version-label-sync-smoke.cjs`

