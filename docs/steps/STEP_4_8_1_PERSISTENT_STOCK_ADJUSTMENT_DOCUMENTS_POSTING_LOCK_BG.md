# Step 4.8.1 — Persistent Stock Adjustment Documents + Posting Lock

Статус: changed-files patch за AutoGrand ERP V2.

## Цел

Step 4.8 беше foundation/preview слой за складова корекция. Step 4.8.1 добавя реален документен слой:

- постоянни документи за складова корекция;
- редове към документа;
- статуси `DRAFT` и `POSTED`;
- заключване след `POSTED`;
- осчетоводяване чрез нов коригиращ складов запис;
- без триене или ръчна редакция на старите складови движения.

## Moneta логика

Корекцията не променя историята назад. Ако има грешка в наличност, отрицателна наличност, двойно движение или разлика от ревизия, системата създава отделен документ за корекция. След осчетоводяване документът е заключен и ефектът влиза като ново движение в складовия журнал.

## Runtime persistence

Добавят се runtime-safe SQLite таблици чрез Prisma raw SQL, без да се изисква Prisma schema migration в тази стъпка:

- `ag_stock_adjustment_documents`
- `ag_stock_adjustment_lines`
- `ag_stock_adjustment_posting_log`

Това пази документа и линиите отделно от стария журнал. При `POSTED` услугата открива реалната таблица за складови движения и записва коригиращо движение там. Ако такава таблица не бъде открита, осчетоводяването спира с ясна грешка, за да не се симулира фалшив журнал.

## Нови API endpoints

- `GET /api/stock/adjustments/documents`
- `POST /api/stock/adjustments/documents`
- `GET /api/stock/adjustments/documents/:id`
- `POST /api/stock/adjustments/documents/:id/lines`
- `PUT /api/stock/adjustments/documents/:id/lines/:lineId`
- `DELETE /api/stock/adjustments/documents/:id/lines/:lineId`
- `POST /api/stock/adjustments/documents/:id/post`
- `POST /api/stock/adjustments/from-issue/persist`

Старите Step 4.8 endpoints остават:

- `/stock-adjustments`
- `/api/stock/adjustments/ping`
- `/api/stock/adjustments/foundation`
- `/api/stock/adjustments/preview`
- `/api/stock/adjustments/from-issue`

## Lock rule

След `POSTED`:

- редовете не могат да се добавят, редактират или изтриват;
- документът връща `locked: true`;
- UI показва заключено състояние;
- повторно `POST` е idempotent и не създава втори запис.

## Променени файлове

- `src/data/stock-adjustment-foundation.js`
- `src/services/stock-adjustment-persistence-service.js`
- `src/services/stock-adjustment-service.js`
- `src/routes/stock-adjustment-routes.js`
- `views/pages/stock-adjustments.hbs`
- `public/css/styles.css` чрез append/replace block
- `docs/steps/STEP_4_8_1_PERSISTENT_STOCK_ADJUSTMENT_DOCUMENTS_POSTING_LOCK_BG.md`
- `docs/checkpoints/STEP_4_8_1_PERSISTENT_STOCK_ADJUSTMENT_DOCUMENTS_POSTING_LOCK_BG.md`

## Проверка

```powershell
node --check .\src\data\stock-adjustment-foundation.js
node --check .\src\services\stock-adjustment-persistence-service.js
node --check .\src\services\stock-adjustment-service.js
node --check .\src\routes\stock-adjustment-routes.js
npm run check
```

След старт:

```text
http://localhost:3000/stock-adjustments
http://localhost:3000/api/stock/adjustments/ping
http://localhost:3000/api/stock/adjustments/foundation
http://localhost:3000/api/stock/adjustments/documents
```
