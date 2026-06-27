# Clean Export — Step 2.8 Stock Adjustment Document Card

## Съдържание

Step 2.8 надгражда Step 2.7 с реални складови документи за корекции.

## Основни файлове

- `prisma/schema.prisma`
- `prisma/dev.db`
- `prisma/migrations/202606271610_step_2_8_stock_adjustment_documents/migration.sql`
- `src/server.js`
- `src/services/stock-actions-service.js`
- `src/services/core-data-service.js`
- `src/data/navigation.js`
- `views/pages/stock-adjustment-new.hbs`
- `views/pages/stock-adjustment-card.hbs`
- `views/pages/stock-dashboard.hbs`
- `scripts/seed-prisma.js`
- `scripts/check-project.mjs`

## Проверки

- `node --check src/server.js`
- `node --check src/services/stock-actions-service.js`
- `node --check src/services/core-data-service.js`
- `node scripts/check-project.mjs`

## Бележка

След прилагане е нужно `npm run db:generate`, защото има нови Prisma модели.
