# AutoGrand ERP V2 — Clean Checkpoint

## Step
Step 2.3 — Sales Payments + Cash Register

## Състояние
- Step 2.2 Sales Posting + Stock Movement работи
- Step 2.3 Sales Payments + Cash Register е приложен
- Продажба → Склад → Плащане → Каса
- Плащанията се записват като CashEntry с kind SALE_PAYMENT
- Таб Плащания показва платено / остатък / статус
- /screen/sales-payments и /screen/daily-cash трябва да показват плащанията

## Стартиране
npm install
npx prisma generate
npm run dev

## Проверка
node --check src/services/sales-actions-service.js
node --check src/services/sales-document-card-service.js
node --check src/server.js
node scripts/check-project.mjs
