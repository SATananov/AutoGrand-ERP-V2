import fs from 'node:fs';

const requiredFiles = [
  'src/services/stock-valuation-service.js',
  'src/routes/stock-valuation-routes.js',
  'views/pages/stock-valuation.hbs',
  'public/js/stock-valuation.js',
  'public/css/stock-valuation.css',
  'docs/reference/step4.11-stock-valuation-inventory-cost-view-foundation.md'
];

let failed = false;
function fail(message) {
  console.error(message);
  failed = true;
}

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) fail(`MISSING ${file}`);
}

const route = fs.existsSync('src/routes/stock-valuation-routes.js') ? fs.readFileSync('src/routes/stock-valuation-routes.js', 'utf8') : '';
const service = fs.existsSync('src/services/stock-valuation-service.js') ? fs.readFileSync('src/services/stock-valuation-service.js', 'utf8') : '';
const page = fs.existsSync('views/pages/stock-valuation.hbs') ? fs.readFileSync('views/pages/stock-valuation.hbs', 'utf8') : '';
const client = fs.existsSync('public/js/stock-valuation.js') ? fs.readFileSync('public/js/stock-valuation.js', 'utf8') : '';

const endpoints = [
  '/stock-valuation',
  '/api/stock/valuation/options',
  '/api/stock/valuation/summary',
  '/api/stock/valuation/balance',
  '/api/stock/valuation/movements-cost',
  '/api/stock/valuation/snapshot'
];
for (const endpoint of endpoints) {
  if (!route.includes(endpoint) && !client.includes(endpoint) && !page.includes(endpoint)) fail(`ENDPOINT_OR_LINK_MISSING ${endpoint}`);
}

const writeRoutePattern = /router\s*\.\s*(post|put|patch|delete)\s*\(/i;
if (writeRoutePattern.test(route)) fail('WRITE_ROUTE_FORBIDDEN in stock valuation routes');

const forbiddenServicePatterns = [
  /\$executeRaw/i,
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  /\bDROP\b/i,
  /\bALTER\b/i,
  /\.create\s*\(/i,
  /\.update\s*\(/i,
  /\.delete\s*\(/i,
  /\.upsert\s*\(/i
];
for (const pattern of forbiddenServicePatterns) {
  if (pattern.test(service)) fail(`FORBIDDEN_SERVICE_WRITE_PATTERN ${pattern}`);
}

if (!/SELECT name FROM sqlite_master/.test(service)) fail('SCHEMA_DISCOVERY_SELECT_MISSING');
if (!/PRAGMA table_info/.test(service)) fail('PRAGMA_DISCOVERY_MISSING');
if (!/getStockValuationSnapshot/.test(service)) fail('SNAPSHOT_SERVICE_EXPORT_MISSING');
if (!/data-stock-valuation-root/.test(page)) fail('VALUATION_PAGE_ROOT_MISSING');
if (!/fetch\(\/api\/stock\/valuation/.test(client.replaceAll('`', ''))) {
  const usesValuationApi = client.includes('/api/stock/valuation/');
  if (!usesValuationApi) fail('CLIENT_VALUATION_API_MISSING');
}

if (failed) process.exit(1);
console.log('OK: Step 4.11 stock valuation read-only foundation checks passed.');
