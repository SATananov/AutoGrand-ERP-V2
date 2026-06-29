import fs from 'node:fs';

const baseUrl = process.env.AUTOGRAND_SMOKE_URL;

if (!baseUrl) {
  const requiredFiles = [
    'src/routes/stock-valuation-routes.js',
    'src/services/stock-valuation-service.js',
    'views/pages/stock-valuation.hbs',
    'public/js/stock-valuation.js',
    'public/css/stock-valuation.css',
    'scripts/check-step4.11.4-stock-valuation-final-qa-closure.mjs',
    'docs/reference/step4.11.4-stock-valuation-final-qa-clean-module-closure.md',
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing smoke file: ${file}`);
    }
  }

  console.log('OK: Step 4.11.4 static smoke passed. Set AUTOGRAND_SMOKE_URL for HTTP smoke.');
  process.exit(0);
}

const endpoints = [
  '/stock-valuation',
  '/api/stock/valuation/options',
  '/api/stock/valuation/summary',
  '/api/stock/valuation/balance',
  '/api/stock/valuation/movements-cost',
  '/api/stock/valuation/snapshot',
  '/api/stock/valuation/item-ledger',
  '/api/stock/valuation/cost-source',
  '/api/stock/valuation/manager-snapshot',
];

for (const endpoint of endpoints) {
  const url = new URL(endpoint, baseUrl);
  const response = await fetch(url);
  if (response.status >= 500) {
    throw new Error(`HTTP smoke failed for ${endpoint}: ${response.status}`);
  }
}

console.log('OK: Step 4.11.4 HTTP smoke passed.');
