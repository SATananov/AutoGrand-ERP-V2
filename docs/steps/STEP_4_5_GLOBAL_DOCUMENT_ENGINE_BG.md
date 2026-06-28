# Step 4.5 — Global Document Engine

## Цел

Тази стъпка добавя обща документна основа за AutoGrand ERP V2, съобразена с Moneta модела. Не се създават нови Prisma таблици и не се променя `prisma/dev.db`; това е runtime/foundation слой, който описва общия engine за бъдещото завършване на продажби, доставки, складови трансфери, складови корекции, печат и счетоводни posting hooks.

## Moneta reference

От Moneta ZIP-а се виждат общи документни концепции и hooks:

- `TfBaseEditDocument`
- `TfBaseBrowseCardDocument`
- `TfBaseEditPostedDocument`
- `TfEdPostDocumentEdit`
- `PostDocument`
- `CheckCanPostDocument`
- `CheckInDocument`
- `CheckOutDocument`
- `AnnulDocument`
- `PrintPostedDocument`
- `S_CopyDocTemplateHeader`
- `S_CopyDocTemplateLine`
- `DocumentNo`
- `DocumentDate`
- `PostingDate`
- `DocStatus`
- `PostingUser_Id`

Това показва, че Moneta не мисли всяка форма като отделен остров, а като общ документен engine с header, lines, status flow, action rights, posting checks, copy templates и print hooks.

## Добавени файлове

- `src/data/autogrand-document-engine-foundation.js`
- `src/services/document-engine-service.js`
- `public/js/ag-document-engine.js`
- `views/pages/document-engine.hbs`

## Обновени файлове

- `package.json`
- `package-lock.json`
- `public/css/styles.css`
- `scripts/check-project.mjs`
- `src/server.js`
- `src/services/permission-service.js`
- `views/layouts/main.hbs`

## Нови routes

- `GET /document-engine`
- `GET /api/document-engine/diagnostics`

## Документни типове

Foundation-ът описва:

- `SALE_INVOICE` → `D_SaleInvoiceHeader` / `D_SaleInvoiceLine`
- `SALE_RETURN` → `D_SaleCreditMemoHeader` / `D_SaleCreditMemoLine`
- `PURCHASE_DELIVERY` → `D_PurchaseInvoiceHeader` / `D_PurchaseInvoiceLine`
- `STOCK_TRANSFER` → `D_InvTransferHeader` / `D_InvTransferLine`
- `STOCK_ADJUSTMENT` → `D_InvAdjustmentHeader` / `D_InvAdjustmentLine`

## Статуси

- `DRAFT` / `OPEN`
- `READY` / `CHECKED`
- `POSTED` / `POSTED`
- `ANNULLED` / `ANNUL`

## Действия

- `CREATE`
- `EDIT_HEADER`
- `ADD_LINE`
- `RECALCULATE`
- `POST`
- `ANNUL`
- `COPY`
- `PRINT`

## Права

Добавя се permission:

- `document_engine.view`

Route guard-ът пази:

- `/document-engine`
- `/api/document-engine/diagnostics`

## Проверка

`npm run check` трябва да даде:

- `OK: Step 4.5 document engine foundation data`
- `OK: Step 4.5 Moneta document engine concepts`
- `OK: Step 4.5 document engine service`
- `OK: Step 4.5 document engine diagnostics`
- `OK: Step 4.5 document engine routes and health label`
- `OK: Step 4.5 document engine permissions`
- `OK: Step 4.5 document engine UI`
- `OK: Step 4.5 browser document engine runtime`
- `OK: Step 4.5 docs and checkpoint`

## Бележка

Това е foundation step. Реалното пренасочване на съществуващите sales/purchase/stock document services към общия engine трябва да стане внимателно в следващите стъпки, без да се чупят работещите CRUD и posting flows.
