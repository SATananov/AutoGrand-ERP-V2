import fs from 'node:fs';

const requiredFiles = [
  'src/services/stock-valuation-service.js',
  'src/routes/stock-valuation-routes.js',
  'views/pages/stock-valuation.hbs',
  'public/js/stock-valuation.js',
  'public/css/stock-valuation.css',
  'docs/reference/step4.11.2-stock-valuation-drilldown-cost-source-inspector.md'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

const service = fs.readFileSync('src/services/stock-valuation-service.js', 'utf8');
const routes = fs.readFileSync('src/routes/stock-valuation-routes.js', 'utf8');
const view = fs.readFileSync('views/pages/stock-valuation.hbs', 'utf8');
const client = fs.readFileSync('public/js/stock-valuation.js', 'utf8');

const mustContain = [
  [service, 'getStockValuationItemLedger'],
  [service, 'getStockValuationCostSource'],
  [service, 'buildValuationDrilldown'],
  [service, 'runningQuantity'],
  [routes, "router.get('/api/stock/valuation/item-ledger'"],
  [routes, "router.get('/api/stock/valuation/cost-source'"],
  [view, 'data-valuation-tab="inspector"'],
  [view, 'data-ledger-table'],
  [view, 'data-source-table'],
  [client, '/api/stock/valuation/item-ledger'],
  [client, '/api/stock/valuation/cost-source'],
  [client, 'data-inspect-item']
];

for (const [content, needle] of mustContain) {
  if (!content.includes(needle)) throw new Error(`Missing expected marker: ${needle}`);
}

const forbiddenRoutePattern = /router\.(post|put|patch|delete)\s*\(\s*['"]\/api\/stock\/valuation/i;
if (forbiddenRoutePattern.test(routes)) {
  throw new Error('Forbidden write valuation route detected.');
}

const forbiddenServicePatterns = [/\.create\s*\(/, /\.update\s*\(/, /\.delete\s*\(/, /\.upsert\s*\(/, /\$executeRawUnsafe\s*\(/];
for (const pattern of forbiddenServicePatterns) {
  if (pattern.test(service)) throw new Error(`Forbidden write pattern detected in stock valuation service: ${pattern}`);
}

console.log('OK: Step 4.11.2 stock valuation drilldown / cost source inspector checks passed.');
