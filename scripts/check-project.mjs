import fs from 'fs';
import path from 'path';

const required = [
  'src/server.js',
  'src/services/sales-actions-service.js',
  'src/services/sales-document-card-service.js',
  'src/services/purchase-actions-service.js',
  'src/services/purchase-document-card-service.js',
  'views/pages/sales-document-card.hbs',
  'views/pages/purchase-document-card.hbs',
  'views/pages/purchase-document-new.hbs',
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
const appJs = fs.readFileSync(path.resolve('public/js/app.js'), 'utf8');

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
  [server.includes("step: '2-4-purchases-delivery-stock-in'"), 'Step 2.4 health label'],
  [browse.includes('screen.hasDocumentCard'), 'generic document browse flag'],
  [appJs.includes('documentCardPath'), 'generic document card path']
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

console.log('OK: Step 2.4 Purchases / Deliveries / Stock IN patch check passed.');
