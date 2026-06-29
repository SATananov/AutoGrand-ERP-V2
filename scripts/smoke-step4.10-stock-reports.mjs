import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const baseUrl = process.env.AUTOGRAND_SMOKE_URL || '';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

async function runStaticSmoke() {
  const route = read('src/routes/stock-reports-routes.js');
  const service = read('src/services/stock-reports-service.js');
  const page = read('views/pages/stock-reports.hbs');
  const client = read('public/js/stock-reports.js');

  assert(route.includes("router.get('/stock-reports'"), 'Page route is missing.');
  assert(!/router\.(post|put|patch|delete)\s*\(/i.test(route), 'Stock reports route must stay GET-only.');
  assert(!/\$executeRaw/i.test(service), 'Stock reports service must not execute writes.');
  assert(!/\.(create|update|delete|upsert)\s*\(/i.test(service), 'Stock reports service must not call Prisma writes.');
  assert(page.includes('data-stock-report-balance'), 'Balance table binding missing.');
  assert(page.includes('data-stock-report-movements'), 'Movements table binding missing.');
  assert(client.includes('window.print()'), 'Print action missing.');
  assert(client.includes('text/csv'), 'CSV export action missing.');
}

async function runHttpSmoke() {
  if (!baseUrl) return;
  const targets = [
    '/stock-reports',
    '/api/stock/reports/options',
    '/api/stock/reports/summary',
    '/api/stock/reports/balance',
    '/api/stock/reports/movements'
  ];
  for (const target of targets) {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}${target}`);
    assert(response.status < 500, `${target} returned ${response.status}`);
  }
}

try {
  await runStaticSmoke();
  await runHttpSmoke();
  console.log(baseUrl ? 'OK: Step 4.10 static + HTTP smoke passed.' : 'OK: Step 4.10 static smoke passed. Set AUTOGRAND_SMOKE_URL for HTTP smoke.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
