# Clean Export Checkpoint — Step 2.8.1 Stock Adjustment Wording Polish

## Checkpoint

AutoGrand ERP V2 Step 2.8.1 добавя ясни потребителски текстове за складовите корекции.

## Съдържание

- Меню: „Нова складова корекция“.
- Форма: помощни карти за намерена стока, липса, брак и начално салдо.
- Карта на документ: по-ясни текстове за причина, промяна и заключване след публикуване.
- Service labels: по-разбираеми типове корекция.
- Без промени в база данни и складова логика.

## Проверки

- `node scripts/check-project.mjs`
- `node --check src/server.js`
- `node --check src/services/stock-actions-service.js`
- `node --check public/js/app.js`
- `node --check public/js/erp-v2-workspace-manager.js`
