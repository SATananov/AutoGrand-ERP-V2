import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'src/services/stock-reports-service.js',
  'src/routes/stock-reports-routes.js',
  'views/pages/stock-reports.hbs',
  'public/js/stock-reports.js',
  'public/css/stock-reports.css',
  'scripts/smoke-step4.10-stock-reports.mjs',
  'docs/reference/step4.10-stock-reports-inventory-analytics-foundation.md'
];

const forbiddenWritePatterns = [
  /router\.(post|put|patch|delete)\s*\(/i,
  /\$executeRaw/i,
  /\.(create|update|delete|upsert|createMany|updateMany|deleteMany)\s*\(/i,
  /stock\s*journal\s*delete/i,
  /posted\s*document\s*unlock/i
];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) fail(`Missing required file: ${file}`);
}

const route = read('src/routes/stock-reports-routes.js');
const service = read('src/services/stock-reports-service.js');
const page = read('views/pages/stock-reports.hbs');
const publicJs = read('public/js/stock-reports.js');

for (const [label, content] of [
  ['route', route],
  ['service', service],
  ['page', page],
  ['publicJs', publicJs]
]) {
  for (const pattern of forbiddenWritePatterns) {
    if (pattern.test(content)) fail(`${label} contains forbidden write pattern: ${pattern}`);
  }
}

if (!route.includes("router.get('/stock-reports'")) fail('Missing /stock-reports page route.');
if (!route.includes("/api/stock/reports/summary")) fail('Missing summary API route.');
if (!route.includes("/api/stock/reports/balance")) fail('Missing balance API route.');
if (!route.includes("/api/stock/reports/movements")) fail('Missing movements API route.');
if (!service.includes('$queryRawUnsafe')) fail('Service must read from database through raw SELECT introspection.');
if (!service.includes('SELECT * FROM')) fail('Service must read movement rows with SELECT.');
if (!page.includes('Read-only')) fail('Page must visibly mark the module as read-only.');
if (!publicJs.includes('/api/stock/reports/summary')) fail('Client script must call the summary endpoint.');

if (!process.exitCode) {
  console.log('OK: Step 4.10 stock reports static checks passed.');
}
