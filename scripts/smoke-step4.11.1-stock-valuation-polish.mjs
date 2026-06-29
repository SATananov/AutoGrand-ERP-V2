import fs from 'node:fs';

const routeText = fs.readFileSync('src/routes/stock-valuation-routes.js', 'utf8');
const pageText = fs.readFileSync('views/pages/stock-valuation.hbs', 'utf8');
const clientText = fs.readFileSync('public/js/stock-valuation.js', 'utf8');

for (const endpoint of [
  '/stock-valuation',
  '/api/stock/valuation/options',
  '/api/stock/valuation/summary',
  '/api/stock/valuation/balance',
  '/api/stock/valuation/movements-cost',
  '/api/stock/valuation/snapshot'
]) {
  if (!routeText.includes(endpoint)) throw new Error(`Missing valuation endpoint: ${endpoint}`);
}

for (const uiToken of [
  'data-filter-confidence',
  'data-filter-manager-focus',
  'data-filter-value-band',
  'data-filter-value-min',
  'data-filter-value-max',
  'data-manager-strip'
]) {
  if (!pageText.includes(uiToken)) throw new Error(`Missing valuation UI token: ${uiToken}`);
}

for (const clientToken of ['confidenceBadge', 'valueBandBadge', 'managerFlagBadge', 'data-valuation-period']) {
  if (!clientText.includes(clientToken)) throw new Error(`Missing valuation client behavior: ${clientToken}`);
}

console.log('OK: Step 4.11.1 static smoke passed. Set AUTOGRAND_SMOKE_URL for HTTP smoke.');
