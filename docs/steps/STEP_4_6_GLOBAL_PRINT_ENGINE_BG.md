# Step 4.6 — Global Print Engine

## Цел

Тази стъпка добавя общ AutoGrand print engine foundation, съобразен с Moneta.
Фокусът е върху печатни форми, preview, export, етикети, barcode/QR, printer profiles и hooks към документния engine.

## Moneta reference concepts

Step 4.6 е ориентиран по следите в Moneta ZIP:

- `TfBase.PrintSelect`
- `TfBase.Print`
- `TfBase.AfterPrintDocument`
- `TfBase.PrintTXT`
- `TfBase.PrintLabel`
- `TfBase.GetPrintDocumentType`
- `TfBase.GetPrintDocument`
- `TfBase.PrintPostedDocument`
- `TfBase.CanPrintPostedDoc`
- `TfBase.SelectPrintFormGeneral`
- `TfBase.SelectWebReport`
- `uBrSelectPrintForm`
- `uPrintPreview`
- `uPrintSetup`
- `frxExportPDF`
- `frxExportXLSX`
- `frxBarcode2D`
- `frxQRCode`

## Добавено

- `src/data/autogrand-print-engine-foundation.js`
- `src/services/print-engine-service.js`
- `public/js/ag-print-engine.js`
- `views/pages/print-engine.hbs`
- routes:
  - `/print-engine`
  - `/api/print-engine/diagnostics`
- permission:
  - `print_engine.view`

## Обхват

Без Prisma schema промяна.
Това е foundation слой, който подготвя бъдещото реално връзване към продажби, доставки, трансфери, корекции, етикети и справки.

## Версия

`0.4.10`

## Health label

`4-6-global-print-engine`
