# Checkpoint — Step 4.12 Inventory Planning / Reorder Suggestions Foundation

Очаквано състояние след apply:

- `package.json` версия `0.4.36`;
- route `/inventory-planning` е регистриран;
- API `/api/stock/inventory-planning` връща read-only snapshot;
- `node --check` минава за новите service/route файлове;
- `npm run check` минава;
- `node scripts/step-4-12-inventory-planning-smoke.cjs` минава;
- няма видими mojibake или replacement-character маркери в новите файлове.

## Clean export checkpoint

След commit и clean git status се стартира:

```powershell
.\create_step_4_12_clean_export_checkpoint.ps1
```

Скриптът трябва да създаде clean ZIP на Desktop с име от вида:

`autogrand-erp-v2_step4_12_inventory-planning-reorder-suggestions-foundation_CLEAN_<timestamp>.zip`

и да отпечата SHA256 и FILES_COPIED.
