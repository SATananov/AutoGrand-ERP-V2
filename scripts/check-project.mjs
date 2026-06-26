import fs from 'fs';
import path from 'path';

const required = [
  'src/server.js',
  'src/services/sales-actions-service.js',
  'src/services/sales-document-card-service.js',
  'views/pages/sales-document-card.hbs',
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

const actions = fs.readFileSync(path.resolve('src/services/sales-actions-service.js'), 'utf8');
const server = fs.readFileSync(path.resolve('src/server.js'), 'utf8');
const card = fs.readFileSync(path.resolve('src/services/sales-document-card-service.js'), 'utf8');

if (!actions.includes('createSalesDocumentPayment')) {
  console.error('MISSING: createSalesDocumentPayment');
  ok = false;
} else {
  console.log('OK: createSalesDocumentPayment');
}

if (!server.includes('/document/sales/:documentId/payments')) {
  console.error('MISSING ROUTE: /document/sales/:documentId/payments');
  ok = false;
} else {
  console.log('OK ROUTE: /document/sales/:documentId/payments');
}

if (!card.includes('paymentSummary')) {
  console.error('MISSING: paymentSummary');
  ok = false;
} else {
  console.log('OK: paymentSummary');
}

if (!ok) {
  process.exit(1);
}

console.log('OK: Step 2.3 Payments patch check passed.');