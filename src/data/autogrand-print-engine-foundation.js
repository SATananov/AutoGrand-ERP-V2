// Step 4.6 — Moneta-aligned Global Print Engine Foundation.
// No Prisma schema change: this is a static runtime blueprint for the shared print/report layer.
// Moneta reference markers: TfBase.PrintSelect, TfBase.Print, TfBase.AfterPrintDocument,
// TfBase.PrintTXT, TfBase.PrintLabel, TfBase.GetPrintDocumentType, TfBase.GetPrintDocument,
// TfBase.PrintPostedDocument, TfBase.CanPrintPostedDoc, TfBase.SelectPrintFormGeneral,
// TfBase.SelectWebReport, TfBaseBrowseCard.BarcodeCallBack, uBrSelectPrintForm, uPrintPreview,
// uPrintSetup, frxPreview, frxExportPDF, frxExportXLSX, frxBarcode2D, frxQRCode.

export const MONETA_PRINT_ENGINE_CONCEPTS = [
  'TfBase.PrintSelect',
  'TfBase.Print',
  'TfBase.AfterPrintDocument',
  'TfBase.PrintTXT',
  'TfBase.PrintLabel',
  'TfBase.GetPrintDocumentType',
  'TfBase.GetPrintDocument',
  'TfBase.PrintPostedDocument',
  'TfBase.CanPrintPostedDoc',
  'TfBase.SelectPrintFormGeneral',
  'TfBase.SelectWebReport',
  'TfBaseBrowseCard.BarcodeCallBack',
  'TfBaseEditDocument.BarcodeCallBack',
  'uBrSelectPrintForm',
  'uPrintPreview',
  'uPrintSetup',
  'frxPreview',
  'frxExportPDF',
  'frxExportXLSX',
  'frxBarcode2D',
  'frxQRCode',
  'FiscalPrinterDataForStorno'
];

export const PRINT_ENGINE_CHANNELS = [
  {
    code: 'PREVIEW',
    monetaAction: 'acPreviewExecute',
    label: 'Преглед преди печат',
    description: 'Визуален preview слой преди реален печат или export.',
    icon: '👁️',
    requiresDevice: false,
    supportsPostedOnly: false
  },
  {
    code: 'BROWSER_PRINT',
    monetaAction: 'TfBase.Print',
    label: 'Печат през браузър',
    description: 'HTML print surface, който по-късно може да се замени с реален print adapter.',
    icon: '🖨️',
    requiresDevice: false,
    supportsPostedOnly: false
  },
  {
    code: 'PDF_EXPORT',
    monetaAction: 'frxExportPDF',
    label: 'Експорт PDF',
    description: 'Печатна форма като PDF export / архив.',
    icon: '📄',
    requiresDevice: false,
    supportsPostedOnly: false
  },
  {
    code: 'XLSX_EXPORT',
    monetaAction: 'frxExportXLSX',
    label: 'Експорт Excel',
    description: 'Таблични справки и редове към Excel.',
    icon: '📊',
    requiresDevice: false,
    supportsPostedOnly: false
  },
  {
    code: 'TXT_EXPORT',
    monetaAction: 'TfBase.PrintTXT',
    label: 'Текстов печат',
    description: 'Лесен текстов layout за складови бележки и стари принтери.',
    icon: '🧾',
    requiresDevice: false,
    supportsPostedOnly: false
  },
  {
    code: 'LABEL_PRINT',
    monetaAction: 'TfBase.PrintLabel',
    label: 'Етикети / баркод',
    description: 'Печат на етикети с barcode/QR за артикул или документ.',
    icon: '🏷️',
    requiresDevice: true,
    supportsPostedOnly: false
  },
  {
    code: 'FISCAL_PRINTER',
    monetaAction: 'FiscalPrinterDataForStorno',
    label: 'Фискален принтер',
    description: 'Запазен adapter слой за бъдеща връзка с фискални устройства.',
    icon: '💳',
    requiresDevice: true,
    supportsPostedOnly: true
  },
  {
    code: 'WEB_REPORT',
    monetaAction: 'TfBase.SelectWebReport',
    label: 'Web report',
    description: 'Уеб справка/отчет, генериран от същия print engine.',
    icon: '🌐',
    requiresDevice: false,
    supportsPostedOnly: false
  }
];

export const PRINT_ENGINE_DOCUMENT_FORMS = [
  {
    code: 'SALE_INVOICE_STANDARD',
    documentType: 'SALE_INVOICE',
    monetaPrintType: 'D_SaleInvoiceHeader',
    label: 'Продажба / фактура — стандартна',
    defaultChannel: 'PREVIEW',
    permission: 'sales.print',
    templateSections: ['HEADER', 'CONTRAGENT', 'LINES', 'TOTALS', 'VAT', 'SIGNATURES', 'QR'],
    supportedChannels: ['PREVIEW', 'BROWSER_PRINT', 'PDF_EXPORT', 'TXT_EXPORT', 'FISCAL_PRINTER'],
    postedOnly: false
  },
  {
    code: 'PURCHASE_DELIVERY_STANDARD',
    documentType: 'PURCHASE_DELIVERY',
    monetaPrintType: 'D_PurchaseInvoiceHeader',
    label: 'Доставка от доставчик — приемна бележка',
    defaultChannel: 'PREVIEW',
    permission: 'purchase.print',
    templateSections: ['HEADER', 'SUPPLIER', 'LINES', 'TOTALS', 'VAT', 'SIGNATURES'],
    supportedChannels: ['PREVIEW', 'BROWSER_PRINT', 'PDF_EXPORT', 'XLSX_EXPORT'],
    postedOnly: false
  },
  {
    code: 'STOCK_TRANSFER_PICKING',
    documentType: 'STOCK_TRANSFER',
    monetaPrintType: 'D_InvTransferHeader',
    label: 'Складов трансфер — picking slip',
    defaultChannel: 'BROWSER_PRINT',
    permission: 'stock.transfer.print',
    templateSections: ['HEADER', 'SOURCE_LOCATION', 'TARGET_LOCATION', 'LINES', 'BARCODE', 'SIGNATURES'],
    supportedChannels: ['PREVIEW', 'BROWSER_PRINT', 'PDF_EXPORT', 'TXT_EXPORT'],
    postedOnly: false
  },
  {
    code: 'STOCK_ADJUSTMENT_PROTOCOL',
    documentType: 'STOCK_ADJUSTMENT',
    monetaPrintType: 'D_InvAdjustmentHeader',
    label: 'Складова корекция — протокол',
    defaultChannel: 'PDF_EXPORT',
    permission: 'stock.adjustment.print',
    templateSections: ['HEADER', 'REASON', 'LINES', 'TOTALS', 'SIGNATURES'],
    supportedChannels: ['PREVIEW', 'BROWSER_PRINT', 'PDF_EXPORT'],
    postedOnly: false
  },
  {
    code: 'ITEM_LABEL_BARCODE',
    documentType: 'ITEM_LABEL',
    monetaPrintType: 'N_Item',
    label: 'Етикет артикул / баркод',
    defaultChannel: 'LABEL_PRINT',
    permission: 'catalog.print',
    templateSections: ['ITEM', 'PRICE', 'BARCODE', 'QR'],
    supportedChannels: ['PREVIEW', 'LABEL_PRINT', 'PDF_EXPORT'],
    postedOnly: false
  },
  {
    code: 'GRID_REPORT_EXPORT',
    documentType: 'GRID_REPORT',
    monetaPrintType: 'TfBrReport',
    label: 'Справка от таблица / report',
    defaultChannel: 'WEB_REPORT',
    permission: 'reports.print',
    templateSections: ['FILTERS', 'GRID_COLUMNS', 'LINES', 'TOTALS'],
    supportedChannels: ['PREVIEW', 'WEB_REPORT', 'PDF_EXPORT', 'XLSX_EXPORT'],
    postedOnly: false
  }
];

export const PRINT_ENGINE_TEMPLATE_SECTIONS = [
  { code: 'HEADER', monetaDataset: 'HeaderDS', label: 'Заглавна част', required: true, printBand: 'ReportTitle' },
  { code: 'CONTRAGENT', monetaDataset: 'ContragentDS', label: 'Контрагент / клиент', required: false, printBand: 'MasterData' },
  { code: 'SUPPLIER', monetaDataset: 'VendorDS', label: 'Доставчик', required: false, printBand: 'MasterData' },
  { code: 'SOURCE_LOCATION', monetaDataset: 'SourceLocationDS', label: 'Изходен обект', required: false, printBand: 'MasterData' },
  { code: 'TARGET_LOCATION', monetaDataset: 'TargetLocationDS', label: 'Приемащ обект', required: false, printBand: 'MasterData' },
  { code: 'LINES', monetaDataset: 'LineDS', label: 'Редове', required: true, printBand: 'DetailData' },
  { code: 'TOTALS', monetaDataset: 'TotalsDS', label: 'Суми', required: false, printBand: 'Footer' },
  { code: 'VAT', monetaDataset: 'VatEntryDS', label: 'ДДС разбивка', required: false, printBand: 'Footer' },
  { code: 'BARCODE', monetaDataset: 'BarcodeDS', label: 'Баркод', required: false, printBand: 'Overlay' },
  { code: 'QR', monetaDataset: 'QrCodeDS', label: 'QR код', required: false, printBand: 'Overlay' },
  { code: 'SIGNATURES', monetaDataset: 'SignatureDS', label: 'Подписи', required: false, printBand: 'PageFooter' },
  { code: 'FILTERS', monetaDataset: 'FilterDS', label: 'Филтри на справка', required: false, printBand: 'ReportTitle' },
  { code: 'GRID_COLUMNS', monetaDataset: 'VisibleFields', label: 'Видими колони', required: false, printBand: 'Header' },
  { code: 'REASON', monetaDataset: 'ReasonDS', label: 'Основание / причина', required: false, printBand: 'MasterData' },
  { code: 'ITEM', monetaDataset: 'ItemDS', label: 'Артикул', required: true, printBand: 'MasterData' },
  { code: 'PRICE', monetaDataset: 'PriceDS', label: 'Цена', required: false, printBand: 'MasterData' }
];

export const PRINT_ENGINE_DEVICE_PROFILES = [
  {
    code: 'DEFAULT_OFFICE',
    label: 'Офис принтер',
    monetaSource: 'uPrintSetup',
    channel: 'BROWSER_PRINT',
    paper: 'A4',
    orientation: 'portrait',
    copies: 1,
    isDefault: true
  },
  {
    code: 'WAREHOUSE_SLIP',
    label: 'Складов принтер',
    monetaSource: 'uPrintSetup',
    channel: 'TXT_EXPORT',
    paper: 'A5',
    orientation: 'portrait',
    copies: 1,
    isDefault: false
  },
  {
    code: 'LABEL_58MM',
    label: 'Етикетен принтер 58mm',
    monetaSource: 'uPrintSetup',
    channel: 'LABEL_PRINT',
    paper: '58x40',
    orientation: 'landscape',
    copies: 1,
    isDefault: false
  },
  {
    code: 'FISCAL_POS',
    label: 'Фискално устройство',
    monetaSource: 'FiscalPrinterDataForStorno',
    channel: 'FISCAL_PRINTER',
    paper: 'receipt',
    orientation: 'portrait',
    copies: 1,
    isDefault: false
  }
];

export const PRINT_ENGINE_HOOKS = [
  { code: 'GET_PRINT_DOCUMENT_TYPE', monetaMethod: 'GetPrintDocumentType', label: 'Определя печатния тип според документа', phase: 'resolve' },
  { code: 'GET_PRINT_DOCUMENT', monetaMethod: 'GetPrintDocument', label: 'Събира header/lines/totals dataset', phase: 'dataset' },
  { code: 'CAN_PRINT_POSTED_DOC', monetaMethod: 'CanPrintPostedDoc', label: 'Проверява дали приключен документ може да се печата', phase: 'guard' },
  { code: 'SELECT_PRINT_FORM_GENERAL', monetaMethod: 'SelectPrintFormGeneral', label: 'Избор на печатна форма', phase: 'select' },
  { code: 'PRINT_SELECT', monetaMethod: 'PrintSelect', label: 'Отваря избор на форма/канал', phase: 'select' },
  { code: 'PRINT', monetaMethod: 'Print', label: 'Изпълнява печат', phase: 'execute' },
  { code: 'AFTER_PRINT_DOCUMENT', monetaMethod: 'AfterPrintDocument', label: 'Post-print hook / audit', phase: 'audit' },
  { code: 'PRINT_TXT', monetaMethod: 'PrintTXT', label: 'Текстов печат', phase: 'execute' },
  { code: 'PRINT_LABEL', monetaMethod: 'PrintLabel', label: 'Етикетен печат', phase: 'execute' },
  { code: 'BARCODE_CALLBACK', monetaMethod: 'BarcodeCallBack', label: 'Barcode/QR callback', phase: 'barcode' },
  { code: 'SELECT_WEB_REPORT', monetaMethod: 'SelectWebReport', label: 'Web report selector', phase: 'report' }
];

export const PRINT_ENGINE_AUDIT_EVENTS = [
  { code: 'PRINT_PREVIEW_OPENED', label: 'Отворен preview', auditLevel: 'info' },
  { code: 'PRINT_EXECUTED', label: 'Изпълнен печат', auditLevel: 'important' },
  { code: 'PRINT_EXPORTED_PDF', label: 'Експортиран PDF', auditLevel: 'important' },
  { code: 'PRINT_EXPORTED_XLSX', label: 'Експортиран Excel', auditLevel: 'info' },
  { code: 'PRINT_FISCAL_SENT', label: 'Изпратено към фискален принтер', auditLevel: 'critical' },
  { code: 'PRINT_BLOCKED_BY_PERMISSION', label: 'Блокиран печат по права', auditLevel: 'warning' }
];
