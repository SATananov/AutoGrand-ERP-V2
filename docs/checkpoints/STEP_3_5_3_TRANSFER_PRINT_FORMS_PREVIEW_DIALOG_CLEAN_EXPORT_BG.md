# Clean Export Checkpoint — Step 3.5.3 Transfer Print Forms and Preview Dialog

Този checkpoint добавя работен избор на печатна форма и принтер профил към трансферния печат.

## Обхват

- `views/pages/stock-transfer-print.hbs`
- `src/services/stock-actions-service.js`
- `src/server.js`
- `public/js/app.js`
- `public/css/styles.css`
- `scripts/check-project.mjs`
- `package.json`
- `package-lock.json`
- документация за Step 3.5.3

## Важно

- Няма нова Prisma миграция.
- Няма нужда от `npm run db:generate`.
- Профилите за принтери са UI/ERP профили; реалните пътища към принтери ще се добавят по-късно.
