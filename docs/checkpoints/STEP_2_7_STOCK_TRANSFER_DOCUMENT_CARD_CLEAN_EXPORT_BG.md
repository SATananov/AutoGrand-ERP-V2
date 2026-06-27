# Clean Export — Step 2.7 Stock Transfer Document Card

## Checkpoint

AutoGrand ERP V2 Step 2.7 — Stock Documents Polish / Transfer Document Card.

## Съдържание

- `prisma/schema.prisma` — добавени `StockTransferDocument` и `StockTransferLine`.
- `prisma/migrations/202606271520_step_2_7_stock_transfer_documents/migration.sql`.
- `src/services/stock-actions-service.js` — документен workflow за трансфери.
- `src/services/core-data-service.js` — browse list за трансфер документи.
- `src/server.js` — routes за карта, редове и статус.
- `views/pages/stock-transfer-card.hbs` — карта на складов трансфер.
- `views/pages/stock-transfer-new.hbs` — създава документ Чернова.
- `scripts/seed-prisma.js` — seed с примерен публикуван трансфер документ.
- `scripts/check-project.mjs` — Step 2.7 проверки.

## Правила

- Няма промяна в продажбена/доставна логика.
- Публикуването на трансфер създава складови движения.
- Публикуваните/отказаните трансфери са заключени.
- Бизнес логиката остава server-side.
