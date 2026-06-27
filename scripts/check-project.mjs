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
  'views/pages/stock-item-card.hbs',
  'views/pages/stock-warehouse-card.hbs',
  'views/pages/company-locations.hbs',
  'views/pages/company-location-card.hbs',
  'views/pages/price-list-workbench.hbs',
  'views/pages/screen-browse.hbs',
  'public/js/app.js',
  'public/css/styles.css'
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
const companyLocations = fs.readFileSync(path.resolve('src/services/company-locations-service.js'), 'utf8');
const appJs = fs.readFileSync(path.resolve('public/js/app.js'), 'utf8');
const seedText = fs.readFileSync(path.resolve('scripts/seed-prisma.js'), 'utf8');

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
  [server.includes("step: '3-0-transfer-request-basket-shelf-confirmation'"), 'Step 3.0 health label'],
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
  [seedText.includes("type: 'REGIONAL_WAREHOUSE'") && seedText.includes("canSell: true"), 'regional warehouses can sell'],
  [seedText.includes('stockTransferDocument.create'), 'stock transfer document seed'],
  [seedText.includes('stockAdjustmentDocument.create'), 'stock adjustment document seed'],
  [server.includes("app.get('/price-list'") && server.includes("/api/items/:itemId/image"), 'price list workbench routes'],
  [priceListService.includes('getPriceListWorkbenchData') && priceListService.includes('safeItemImageBaseName') && priceListService.includes('incomingRequests'), 'price list workbench service'],
  [priceListWorkbench.includes('Видими колони') && priceListWorkbench.includes('Снимка') && priceListWorkbench.includes('Трансфер') && priceListWorkbench.includes('Заявки към моя обект'), 'price list availability panel UI'],
  [priceListWorkbench.includes('Текуща заявка за трансфер') && priceListWorkbench.includes('Липса') && priceListWorkbench.includes('Добави'), 'transfer request basket UI'],
  [server.includes('/api/stock/transfer-requests') && stockActions.includes('createTransferRequestsFromBasket') && stockActions.includes('markStockTransferNotFoundOnShelf'), 'transfer request basket API'],
  [appJs.includes('requestBasket') && appJs.includes('submitRequestBasket') && appJs.includes('markTransferMissing'), 'transfer request basket frontend behavior'],
  [appJs.includes('initPriceWorkbench') && appJs.includes('ag_v2_price_list_columns') && appJs.includes('data-price-detail-tab'), 'price list frontend behavior']
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

console.log('OK: Step 3.0 Transfer Request Basket / Shelf Confirmation patch check passed.');
