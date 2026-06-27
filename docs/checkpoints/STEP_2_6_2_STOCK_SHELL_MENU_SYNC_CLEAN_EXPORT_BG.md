# Clean Export — Step 2.6.2 Stock Shell Menu Sync

Checkpoint за поправка на shell/menu визуално разместване след Step 2.6.1.

## Проверки

- `node --check public/js/erp-v2-workspace-manager.js`
- `node --check public/js/app.js`
- `node --check src/server.js`
- `node scripts/check-project.mjs`

## Очакван резултат

Под „Склад“ в лявото меню се вижда „Обекти и складове“ и новите складови V2 екрани. Горният ribbon остава подравнен и не се размества.
