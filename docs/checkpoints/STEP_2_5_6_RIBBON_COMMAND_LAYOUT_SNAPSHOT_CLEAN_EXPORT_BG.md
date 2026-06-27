# Step 2.5.6 Clean Export — Ribbon Command Layout + Snapshot

## Проверка

- ZIP clean export без `.git`, `node_modules`, реален `.env` и backup файлове.
- `node --check public/js/app.js` — OK.
- `node --check public/js/erp-v2-workspace-manager.js` — OK.
- `node --check src/server.js` — OK.
- `node scripts/check-project.mjs` — OK.

## Обхват

Променени са само UI/behavior файлове за горната ribbon командна лента, README/package metadata и документация за стъпката.
