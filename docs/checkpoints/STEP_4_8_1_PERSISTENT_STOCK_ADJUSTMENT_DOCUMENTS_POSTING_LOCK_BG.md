# Checkpoint — Step 4.8.1 Persistent Stock Adjustment Documents + Posting Lock

Очакван статус след apply:

- проектът остава AutoGrand ERP V2;
- version става `0.4.13`;
- route `/stock-adjustments` остава активен;
- Step 4.8 preview endpoints остават активни;
- добавени са persistent document endpoints;
- `DRAFT` документ може да получава редове;
- `POSTED` документ се заключва;
- `POSTED` не трие и не редактира стари движения;
- реалният ефект се записва като ново движение в намерената stock movement таблица;
- ако таблица за складови движения не бъде намерена, post операцията спира безопасно.

## Очакван commit

```powershell
git add package.json package-lock.json public/css/styles.css src/data/stock-adjustment-foundation.js src/services/stock-adjustment-persistence-service.js src/services/stock-adjustment-service.js src/routes/stock-adjustment-routes.js views/pages/stock-adjustments.hbs docs/steps/STEP_4_8_1_PERSISTENT_STOCK_ADJUSTMENT_DOCUMENTS_POSTING_LOCK_BG.md docs/checkpoints/STEP_4_8_1_PERSISTENT_STOCK_ADJUSTMENT_DOCUMENTS_POSTING_LOCK_BG.md
git commit -m "Add Step 4.8.1 stock adjustment persistence and posting lock"
git push origin main
```
