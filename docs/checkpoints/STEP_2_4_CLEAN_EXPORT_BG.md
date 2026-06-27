# Clean Export — Step 2.4 Purchases / Deliveries / Stock IN

Checkpoint за AutoGrand ERP V2 след Step 2.4.

## Цел

Да се добави реален доставен поток, който допълва вече готовия продажбен поток:

Продажба → плащане → каса  
Доставка → входяща стока → склад

## Проверки

- ZIP hygiene: без `node_modules`, `.git`, реален `.env`, backup/temp/cache/junk файлове и nested ZIP.
- JavaScript syntax: всички `.js` и `.mjs` файлове трябва да минават с `node --check`.
- Project check: `node scripts/check-project.mjs`.
- Handlebars файловете трябва да имат балансирани блокове.
- Prisma schema остава съвместима с наличната SQLite структура.

## Step 2.4 резултат

- Доставните browse екрани имат `Нов документ`.
- Доставните редове са реални CRUD редове.
- `DELIVERY` и `SUPPLIER_INVOICE` създават `PURCHASE_IN` складови движения.
- Наличностите се увеличават при осчетоводяване.
- `avgCost` се обновява с претеглена средна цена.
- `/health` връща `2-4-purchases-delivery-stock-in`.
