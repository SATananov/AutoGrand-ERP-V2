// Step 4.5 — Moneta-aligned Global Document Engine Foundation.
// No Prisma schema change: this is a static runtime blueprint for the shared document layer.
// Moneta reference markers: TfBaseEditDocument, TfBaseBrowseCardDocument, TfBaseEditPostedDocument,
// PostDocument, CheckCanPostDocument, CheckInDocument, CheckOutDocument, AnnulDocument,
// S_CopyDocTemplateHeader, S_CopyDocTemplateLine, DocumentNo, DocumentDate, PostingDate,
// DocStatus, PostingUser_Id, D_SaleInvoiceHeader, D_PurchaseInvoiceHeader, InventoryPackage.

export const MONETA_DOCUMENT_ENGINE_CONCEPTS = [
  'TfBaseEditDocument',
  'TfBaseBrowseCardDocument',
  'TfBaseEditPostedDocument',
  'TfEdPostDocumentEdit',
  'PostDocument',
  'CheckCanPostDocument',
  'CheckDocumentBeforeDelete',
  'CheckInDocument',
  'CheckOutDocument',
  'AnnulDocument',
  'S_CopyDocTemplateHeader',
  'S_CopyDocTemplateLine',
  'DocumentNo',
  'DocumentDate',
  'PostingDate',
  'DocStatus',
  'PostingUser_Id',
  'PrintPostedDocument'
];

export const DOCUMENT_ENGINE_STATUS_FLOW = [
  {
    code: 'DRAFT',
    monetaCode: 'OPEN',
    label: 'Чернова',
    description: 'Документът е отворен за редакция и редове.',
    canEditHeader: true,
    canEditLines: true,
    canPost: false,
    canAnnul: false
  },
  {
    code: 'READY',
    monetaCode: 'CHECKED',
    label: 'Проверен',
    description: 'Документът е проверен и готов за приключване.',
    canEditHeader: true,
    canEditLines: true,
    canPost: true,
    canAnnul: false
  },
  {
    code: 'POSTED',
    monetaCode: 'POSTED',
    label: 'Приключен',
    description: 'Документът е заключен и е създал счетоводно/складово действие.',
    canEditHeader: false,
    canEditLines: false,
    canPost: false,
    canAnnul: true
  },
  {
    code: 'ANNULLED',
    monetaCode: 'ANNUL',
    label: 'Анулиран',
    description: 'Документът е неактивен, но остава в историята.',
    canEditHeader: false,
    canEditLines: false,
    canPost: false,
    canAnnul: false
  }
];

export const DOCUMENT_ENGINE_HEADER_FIELDS = [
  { key: 'documentNo', monetaField: 'DocumentNo', label: 'Номер', required: true, width: 120 },
  { key: 'documentDate', monetaField: 'DocumentDate', label: 'Дата на документа', required: true, width: 150 },
  { key: 'postingDate', monetaField: 'PostingDate', label: 'Дата на приключване', required: false, width: 150 },
  { key: 'docStatus', monetaField: 'DocStatus', label: 'Статус', required: true, width: 130 },
  { key: 'contragentId', monetaField: 'Contragent_Id', label: 'Контрагент', required: false, width: 220 },
  { key: 'locationId', monetaField: 'Location_Id', label: 'Обект / склад', required: true, width: 190 },
  { key: 'currencyCode', monetaField: 'Currency_Id', label: 'Валута', required: false, width: 90 },
  { key: 'priceIncludingVat', monetaField: 'PriceIncludingVAT', label: 'Цени с ДДС', required: false, width: 110 },
  { key: 'postingUserId', monetaField: 'PostingUser_Id', label: 'Приключил потребител', required: false, width: 170 },
  { key: 'annulDate', monetaField: 'AnnulDate', label: 'Дата на анулиране', required: false, width: 150 },
  { key: 'annulDescription', monetaField: 'AnnulDesc', label: 'Причина за анулиране', required: false, width: 230 }
];

export const DOCUMENT_ENGINE_LINE_FIELDS = [
  { key: 'lineNo', monetaField: 'LineNo', label: 'Ред', numeric: true, width: 70 },
  { key: 'itemId', monetaField: 'Item_Id', label: 'Артикул', numeric: false, width: 260 },
  { key: 'measureId', monetaField: 'Measure_Id', label: 'Мярка', numeric: false, width: 90 },
  { key: 'quantity', monetaField: 'Quantity', label: 'Количество', numeric: true, width: 110 },
  { key: 'unitPrice', monetaField: 'UnitPrice', label: 'Ед. цена', numeric: true, width: 110 },
  { key: 'unitCost', monetaField: 'UnitCost', label: 'Дост. цена', numeric: true, width: 110 },
  { key: 'lineDiscountPercent', monetaField: 'LineDiscount', label: 'Отстъпка %', numeric: true, width: 115 },
  { key: 'vatProdPostingGroup', monetaField: 'VATProd_PostingGroup', label: 'ДДС продуктова група', numeric: false, width: 165 },
  { key: 'vatPercent', monetaField: 'VATPercent', label: 'ДДС %', numeric: true, width: 90 },
  { key: 'lineAmount', monetaField: 'LineAmount', label: 'Стойност', numeric: true, width: 120 },
  { key: 'sourceDocumentNo', monetaField: 'SourceDocumentNo', label: 'Източник', numeric: false, width: 140 }
];

export const DOCUMENT_ENGINE_TYPES = [
  {
    code: 'SALE_INVOICE',
    monetaHeader: 'D_SaleInvoiceHeader',
    monetaLine: 'D_SaleInvoiceLine',
    label: 'Продажба / фактура',
    module: 'sales',
    prefix: 'SALE',
    postingPermission: 'sales.finish',
    printPermission: 'tools.snapshot',
    routeBase: '/document/sales',
    ledgerEffects: ['stock.out', 'customer.ledger', 'vat.ledger'],
    statusFlow: ['DRAFT', 'READY', 'POSTED', 'ANNULLED']
  },
  {
    code: 'SALE_RETURN',
    monetaHeader: 'D_SaleCreditMemoHeader',
    monetaLine: 'D_SaleCreditMemoLine',
    label: 'Връщане от клиент / кредитно',
    module: 'sales',
    prefix: 'RET',
    postingPermission: 'sales.finish',
    printPermission: 'tools.snapshot',
    routeBase: '/document/sales',
    ledgerEffects: ['stock.in', 'customer.ledger.reverse', 'vat.ledger.reverse'],
    statusFlow: ['DRAFT', 'READY', 'POSTED', 'ANNULLED']
  },
  {
    code: 'PURCHASE_DELIVERY',
    monetaHeader: 'D_PurchaseInvoiceHeader',
    monetaLine: 'D_PurchaseInvoiceLine',
    label: 'Доставка от доставчик',
    module: 'purchase',
    prefix: 'DEL',
    postingPermission: 'purchase.finish',
    printPermission: 'tools.snapshot',
    routeBase: '/document/purchase',
    ledgerEffects: ['stock.in', 'vendor.ledger', 'vat.purchase.ledger'],
    statusFlow: ['DRAFT', 'READY', 'POSTED', 'ANNULLED']
  },
  {
    code: 'STOCK_TRANSFER',
    monetaHeader: 'D_InvTransferHeader',
    monetaLine: 'D_InvTransferLine',
    label: 'Складов трансфер',
    module: 'stock',
    prefix: 'TR',
    postingPermission: 'stock.transfer.finish',
    printPermission: 'stock.transfer.print',
    routeBase: '/stock/transfer',
    ledgerEffects: ['stock.out.source', 'stock.in.target', 'in.transit'],
    statusFlow: ['DRAFT', 'READY', 'POSTED', 'ANNULLED']
  },
  {
    code: 'STOCK_ADJUSTMENT',
    monetaHeader: 'D_InvAdjustmentHeader',
    monetaLine: 'D_InvAdjustmentLine',
    label: 'Складова корекция',
    module: 'stock',
    prefix: 'ADJ',
    postingPermission: 'stock.adjustment.finish',
    printPermission: 'tools.snapshot',
    routeBase: '/stock/adjustment',
    ledgerEffects: ['stock.adjustment', 'variance.audit'],
    statusFlow: ['DRAFT', 'READY', 'POSTED', 'ANNULLED']
  }
];

export const DOCUMENT_ENGINE_ACTIONS = [
  { code: 'CREATE', monetaAction: 'acInsertExecute', label: 'Създаване', requiredPermissionSuffix: 'create', allowedStatuses: ['DRAFT'] },
  { code: 'EDIT_HEADER', monetaAction: 'TfBaseEditDocument.EditHeader', label: 'Редакция на заглавна част', requiredPermissionSuffix: 'edit', allowedStatuses: ['DRAFT', 'READY'] },
  { code: 'ADD_LINE', monetaAction: 'TfBaseEditDocument.AddLine', label: 'Добавяне на ред', requiredPermissionSuffix: 'edit', allowedStatuses: ['DRAFT', 'READY'] },
  { code: 'RECALCULATE', monetaAction: 'RecalcDocumentTotals', label: 'Преизчисляване', requiredPermissionSuffix: 'edit', allowedStatuses: ['DRAFT', 'READY'] },
  { code: 'POST', monetaAction: 'PostDocument', label: 'Приключване / осчетоводяване', requiredPermissionSuffix: 'finish', allowedStatuses: ['READY'] },
  { code: 'ANNUL', monetaAction: 'AnnulDocument', label: 'Анулиране', requiredPermissionSuffix: 'cancel', allowedStatuses: ['POSTED'] },
  { code: 'COPY', monetaAction: 'TfCopyDocument.ProcessSelectedRecords', label: 'Копиране / трансформация', requiredPermissionSuffix: 'create', allowedStatuses: ['POSTED', 'READY'] },
  { code: 'PRINT', monetaAction: 'PrintPostedDocument', label: 'Печат / preview', requiredPermissionSuffix: 'print', allowedStatuses: ['DRAFT', 'READY', 'POSTED'] }
];

export const DOCUMENT_ENGINE_COPY_TEMPLATES = [
  {
    code: 'SALE_ORDER_TO_INVOICE',
    monetaHeader: 'S_CopyDocTemplateHeader',
    monetaLine: 'S_CopyDocTemplateLine',
    label: 'Поръчка → продажба',
    sourceType: 'SALE_ORDER',
    targetType: 'SALE_INVOICE',
    copiesHeader: true,
    copiesLines: true,
    recalculatesPrices: true
  },
  {
    code: 'PURCHASE_ORDER_TO_DELIVERY',
    monetaHeader: 'S_CopyDocTemplateHeader',
    monetaLine: 'S_CopyDocTemplateLine',
    label: 'Поръчка към доставчик → доставка',
    sourceType: 'PURCHASE_ORDER',
    targetType: 'PURCHASE_DELIVERY',
    copiesHeader: true,
    copiesLines: true,
    recalculatesPrices: false
  },
  {
    code: 'TRANSFER_REQUEST_TO_TRANSFER',
    monetaHeader: 'S_CopyDocTemplateHeader',
    monetaLine: 'S_CopyDocTemplateLine',
    label: 'Заявка за трансфер → трансфер',
    sourceType: 'TRANSFER_REQUEST',
    targetType: 'STOCK_TRANSFER',
    copiesHeader: true,
    copiesLines: true,
    recalculatesPrices: false
  }
];

export const DOCUMENT_ENGINE_VALIDATION_HOOKS = [
  { code: 'CHECK_IN_DOCUMENT', monetaProcedure: 'CheckInDocument', label: 'Маркиране като отворен от потребител', phase: 'open' },
  { code: 'CHECK_OUT_DOCUMENT', monetaProcedure: 'CheckOutDocument', label: 'Освобождаване на заключване', phase: 'close' },
  { code: 'CHECK_BEFORE_DELETE', monetaProcedure: 'usp_CheckDocumentBeforeDelete', label: 'Проверка преди изтриване/анулиране', phase: 'annul' },
  { code: 'CHECK_CAN_POST', monetaProcedure: 'CheckCanPostDocument', label: 'Проверка преди приключване', phase: 'post' },
  { code: 'GET_POSTING_INFO', monetaProcedure: 'GetPostingInfo', label: 'Извличане на posting настройка', phase: 'post' },
  { code: 'POST_GLOBAL_DOC', monetaProcedure: 'PostGlobalDoc', label: 'Единна posting операция', phase: 'post' },
  { code: 'PRINT_POSTED_DOCUMENT', monetaProcedure: 'PrintPostedDocument', label: 'Печат след приключване', phase: 'print' }
];

export const DOCUMENT_ENGINE_TOTALS = [
  { key: 'subtotalWithoutVat', label: 'Данъчна основа', formula: 'sum(LineAmountNoVAT)' },
  { key: 'discountTotal', label: 'Отстъпки', formula: 'sum(LineDiscountAmount)' },
  { key: 'vatTotal', label: 'ДДС', formula: 'sum(VATAmount)' },
  { key: 'totalWithVat', label: 'Общо с ДДС', formula: 'subtotalWithoutVat - discountTotal + vatTotal' }
];
