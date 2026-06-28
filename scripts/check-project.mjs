import fs from 'fs';
import path from 'path';

const required = [
  'src/server.js',
  'src/services/sales-actions-service.js',
  'src/services/sales-document-card-service.js',
  'src/services/purchase-actions-service.js',
  'src/services/purchase-document-card-service.js',
  'src/services/stock-actions-service.js',
  'src/services/company-locations-service.js',
  'src/services/price-list-workbench-service.js',
  'views/pages/sales-document-card.hbs',
  'views/pages/purchase-document-card.hbs',
  'views/pages/purchase-document-new.hbs',
  'views/pages/stock-dashboard.hbs',
  'views/pages/stock-adjustment-new.hbs',
  'views/pages/stock-adjustment-card.hbs',
  'views/pages/stock-transfer-new.hbs',
  'views/pages/stock-transfer-card.hbs',
  'views/pages/stock-transfer-center.hbs',
  'views/pages/stock-transfer-print.hbs',
  'views/pages/stock-item-card.hbs',
  'views/pages/stock-warehouse-card.hbs',
  'views/pages/company-locations.hbs',
  'views/pages/company-location-card.hbs',
  'views/pages/price-list-workbench.hbs',
  'views/pages/screen-browse.hbs',
  'public/js/app.js',
  'public/css/styles.css',
  'docs/blueprints/AUTOGRAND_ERP_MASTER_BLUEPRINT_BG.md',
  'docs/blueprints/MONETA_REFERENCE_AUDIT_BG.md',
  'docs/blueprints/CORE_FOUNDATION_DATA_PLAN_BG.md',
  'docs/blueprints/IMPLEMENTATION_SEQUENCE_BG.md',
  'docs/checkpoints/STEP_4_0_MASTER_BLUEPRINT_MONETA_AUDIT_BG.md',
  'src/data/autogrand-foundation.js',
  'docs/steps/STEP_4_1_COMPANY_REAL_LOCATIONS_FOUNDATION_BG.md',
  'docs/checkpoints/STEP_4_1_COMPANY_REAL_LOCATIONS_FOUNDATION_CLEAN_EXPORT_BG.md'
];

let ok = true;

for (const file of required) {
  if (!fs.existsSync(path.resolve(file))) {
    console.error(`MISSING: ${file}`);
    ok = false;
  } else {
    console.log(`OK: ${file}`);
  }
}

const server = fs.readFileSync(path.resolve('src/server.js'), 'utf8');
const salesActions = fs.readFileSync(path.resolve('src/services/sales-actions-service.js'), 'utf8');
const salesCard = fs.readFileSync(path.resolve('src/services/sales-document-card-service.js'), 'utf8');
const purchaseActions = fs.readFileSync(path.resolve('src/services/purchase-actions-service.js'), 'utf8');
const purchaseCard = fs.readFileSync(path.resolve('src/services/purchase-document-card-service.js'), 'utf8');
const browse = fs.readFileSync(path.resolve('views/pages/screen-browse.hbs'), 'utf8');
const stockActions = fs.readFileSync(path.resolve('src/services/stock-actions-service.js'), 'utf8');
const stockDashboard = fs.readFileSync(path.resolve('views/pages/stock-dashboard.hbs'), 'utf8');
const stockTransferCenter = fs.readFileSync(path.resolve('views/pages/stock-transfer-center.hbs'), 'utf8');
const stockTransferPrint = fs.readFileSync(path.resolve('views/pages/stock-transfer-print.hbs'), 'utf8');
const companyLocations = fs.readFileSync(path.resolve('src/services/company-locations-service.js'), 'utf8');
const appJs = fs.readFileSync(path.resolve('public/js/app.js'), 'utf8');
const seedText = fs.readFileSync(path.resolve('scripts/seed-prisma.js'), 'utf8');
const masterBlueprint = fs.readFileSync(path.resolve('docs/blueprints/AUTOGRAND_ERP_MASTER_BLUEPRINT_BG.md'), 'utf8');
const monetaAudit = fs.readFileSync(path.resolve('docs/blueprints/MONETA_REFERENCE_AUDIT_BG.md'), 'utf8');
const foundationPlan = fs.readFileSync(path.resolve('docs/blueprints/CORE_FOUNDATION_DATA_PLAN_BG.md'), 'utf8');
const implementationSequence = fs.readFileSync(path.resolve('docs/blueprints/IMPLEMENTATION_SEQUENCE_BG.md'), 'utf8');
const step40Checkpoint = fs.readFileSync(path.resolve('docs/checkpoints/STEP_4_0_MASTER_BLUEPRINT_MONETA_AUDIT_BG.md'), 'utf8');
const autograndFoundation = fs.readFileSync(path.resolve('src/data/autogrand-foundation.js'), 'utf8');
const step41Doc = fs.readFileSync(path.resolve('docs/steps/STEP_4_1_COMPANY_REAL_LOCATIONS_FOUNDATION_BG.md'), 'utf8');
const step41Checkpoint = fs.readFileSync(path.resolve('docs/checkpoints/STEP_4_1_COMPANY_REAL_LOCATIONS_FOUNDATION_CLEAN_EXPORT_BG.md'), 'utf8');

const adjustmentCard = fs.readFileSync(path.resolve('views/pages/stock-adjustment-card.hbs'), 'utf8');
const priceListWorkbench = fs.readFileSync(path.resolve('views/pages/price-list-workbench.hbs'), 'utf8');
const priceListService = fs.readFileSync(path.resolve('src/services/price-list-workbench-service.js'), 'utf8');

const checks = [
  [salesActions.includes('createSalesDocumentPayment'), 'createSalesDocumentPayment'],
  [server.includes('/document/sales/:documentId/payments'), 'sales payment route'],
  [salesCard.includes('paymentSummary'), 'sales paymentSummary'],
  [purchaseActions.includes('purchaseDocTypeMeta'), 'purchaseDocTypeMeta'],
  [purchaseActions.includes('addPurchaseDocumentLine'), 'addPurchaseDocumentLine'],
  [purchaseActions.includes('updatePurchaseDocumentStatus'), 'updatePurchaseDocumentStatus'],
  [purchaseActions.includes('PURCHASE_IN'), 'PURCHASE_IN stock movement'],
  [purchaseCard.includes('getPurchaseDocumentCardData'), 'getPurchaseDocumentCardData'],
  [server.includes('/document/purchase/new/:docType'), 'purchase new route'],
  [server.includes('/document/purchase/:documentId/status'), 'purchase status route'],
  [server.includes("step: '4-1-company-real-locations-foundation'"), 'Step 4.1 health label'],
  [autograndFoundation.includes('AUTOGRAND_COMPANY') && autograndFoundation.includes('Автогранд ООД') && autograndFoundation.includes('DEFAULT_LOCATION_CODE') && autograndFoundation.includes('AG-KJ-SHOP'), 'Step 4.1 AutoGrand company and default location foundation'],
  [autograndFoundation.includes('AG-STZ-CENTRAL') && autograndFoundation.includes('AG-STZ-WH') && autograndFoundation.includes('Централен склад') && autograndFoundation.includes('Регионален склад Стара Загора'), 'Step 4.1 Stara Zagora separate central/regional objects'],
  [autograndFoundation.includes("canSell: false") && autograndFoundation.includes("canTransfer: false") && autograndFoundation.includes("canTransfer: true"), 'Step 4.1 location role rules'],
  [seedText.includes('AUTOGRAND_LOCATIONS') && seedText.includes('AUTOGRAND_COMPANY'), 'Step 4.1 seed uses centralized foundation data'],
  [companyLocations.includes('canRequestTransferText') && companyLocations.includes('canDispatchTransferText') && companyLocations.includes('canReceiveTransferText'), 'Step 4.1 transfer capability labels'],
  [step41Doc.includes('Фирма → Обект → Потребител → Парола') && step41Checkpoint.includes('0.4.1'), 'Step 4.1 docs and checkpoint'],
  [masterBlueprint.includes('Document Engine') && masterBlueprint.includes('Grid Engine') && masterBlueprint.includes('Print Engine') && masterBlueprint.includes('Permission Engine'), 'Step 4.0 master blueprint engines'],
  [monetaAudit.includes('BasePackage.bpl') && monetaAudit.includes('InventoryPackage.bpl') && monetaAudit.includes('DevicePackage.bpl'), 'Step 4.0 Moneta reference module audit'],
  [foundationPlan.includes('Артикули') && foundationPlan.includes('Потребители') && foundationPlan.includes('Принтер профили') && foundationPlan.includes('Номератори'), 'Step 4.0 foundation data plan'],
  [implementationSequence.includes('Step 4.1') && implementationSequence.includes('Step 4.8') && step40Checkpoint.includes('Архитектурен checkpoint') || step40Checkpoint.includes('архитектурен checkpoint'), 'Step 4.0 implementation sequence and checkpoint'],
  [browse.includes('screen.hasDocumentCard'), 'generic document browse flag'],
  [browse.includes('screen.hasStockActions'), 'stock browse action strip'],
  [stockActions.includes('createStockTransferFromForm'), 'createStockTransferFromForm'],
  [stockActions.includes('getStockTransferCardData'), 'getStockTransferCardData'],
  [stockActions.includes('updateStockTransferDocumentStatus'), 'updateStockTransferDocumentStatus'],
  [stockActions.includes('addStockTransferLine'), 'addStockTransferLine'],
  [stockActions.includes('createStockAdjustmentFromForm'), 'createStockAdjustmentFromForm'],
  [stockActions.includes('getStockAdjustmentCardData'), 'getStockAdjustmentCardData'],
  [stockActions.includes('updateStockAdjustmentDocumentStatus'), 'updateStockAdjustmentDocumentStatus'],
  [stockActions.includes('addStockAdjustmentLine'), 'addStockAdjustmentLine'],
  [server.includes('/stock/adjustment/:documentId/status'), 'stock adjustment status route'],
  [server.includes('/stock/adjustment/:documentId/lines'), 'stock adjustment line route'],
  [adjustmentCard.includes('Документ за складова корекция') && adjustmentCard.includes('Промяна'), 'stock adjustment wording polish'],
  [stockActions.includes('getStockItemCardData'), 'getStockItemCardData'],
  [stockDashboard.includes('/stock/transfer/new'), 'stock dashboard transfer link'],
  [companyLocations.includes('getCompanyLocationsData'), 'getCompanyLocationsData'],
  [companyLocations.includes('locationTypeText'), 'locationTypeText'],
  [server.includes("/locations"), 'company locations route'],
  [server.includes("/stock/dashboard"), 'stock dashboard route'],
  [server.includes("/stock/adjustment/new"), 'stock adjustment new route'],
  [server.includes("/stock/transfer/new"), 'stock transfer route'],
  [server.includes("/stock/transfer/:documentId"), 'stock transfer card route'],
  [appJs.includes('rowOpenUrl'), 'generic row open url'],
  [autograndFoundation.includes("type: 'REGIONAL_WAREHOUSE'") && autograndFoundation.includes("canSell: true"), 'regional warehouses can sell'],
  [seedText.includes('stockTransferDocument.create'), 'stock transfer document seed'],
  [seedText.includes('stockAdjustmentDocument.create'), 'stock adjustment document seed'],
  [server.includes("app.get('/price-list'") && server.includes("/api/items/:itemId/image"), 'price list workbench routes'],
  [priceListService.includes('getPriceListWorkbenchData') && priceListService.includes('safeItemImageBaseName') && priceListService.includes('incomingRequests'), 'price list workbench service'],
  [priceListWorkbench.includes('Видими колони') && priceListWorkbench.includes('Снимка') && priceListWorkbench.includes('Трансфер') && (priceListWorkbench.includes('Заявки към текущ обект') || priceListWorkbench.includes('Заявки към моя обект')), 'price list availability panel UI'],
  [priceListWorkbench.includes('Текуща заявка за трансфер') && priceListWorkbench.includes('Липса') && priceListWorkbench.includes('Добави'), 'transfer request basket UI'],
  [server.includes('/api/stock/transfer-requests') && stockActions.includes('createTransferRequestsFromBasket') && stockActions.includes('markStockTransferNotFoundOnShelf'), 'transfer request basket API'],
  [server.includes("app.get('/stock/transfers'") && stockActions.includes('getStockTransferRequestsCenterData') && stockTransferCenter.includes('Пътува към текущ обект') && stockTransferCenter.includes('Бързи действия'), 'transfer center polish status counters'],
  [stockActions.includes('stock_transfer_in_transit') && stockActions.includes('workflowCards') && stockActions.includes('priorityRows'), 'Step 3.4 transfer center service polish'],
  [appJs.includes('requestBasket') && appJs.includes('submitRequestBasket') && appJs.includes('markTransferMissing'), 'transfer request basket frontend behavior'],
  [appJs.includes('initPriceWorkbench') && appJs.includes('ag_v2_price_list_columns') && appJs.includes('data-price-detail-tab'), 'price list frontend behavior'],
  [server.includes("/stock/transfer/:documentId/print") && stockActions.includes('getStockTransferPrintData') && stockTransferPrint.includes('data-transfer-print') && stockTransferPrint.includes('Избор на печатна форма') && stockTransferPrint.includes('Принтер профил') && stockTransferPrint.includes('Дост. цена') && stockTransferPrint.includes('Прод. с ДДС') && stockTransferPrint.includes('За кого / причина') && stockActions.includes('quantityAlertClass') && stockActions.includes('transferPurposeNote'), 'Step 3.5.4 transfer print compact picking polish'],
  [stockTransferCenter.includes('data-transfer-center-command="print"') && appJs.includes('initTransferPrintSlip'), 'Step 3.5 transfer print buttons'],
  [appJs.includes('handleRibbonPrintCommand') && appJs.includes('activeDocumentPrintUrl') && appJs.includes('openTransferPrintDialog'), 'Step 3.5.5 ribbon print sync']
];

for (const [passed, label] of checks) {
  if (!passed) {
    console.error(`MISSING: ${label}`);
    ok = false;
  } else {
    console.log(`OK: ${label}`);
  }
}

if (!ok) {
  process.exit(1);
}

console.log('OK: Step 4.1 Company + Real AutoGrand Locations Foundation patch check passed.');
