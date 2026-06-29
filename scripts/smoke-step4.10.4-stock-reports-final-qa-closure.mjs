import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.AUTOGRAND_SMOKE_URL || '';

function request(url, accept = 'application/json') {
  return new Promise((resolve, reject) => {
    http.get(url, { headers: { Accept: accept } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        resolve({ statusCode: res.statusCode, body, headers: res.headers });
      });
    }).on('error', reject);
  });
}

if (!baseUrl) {
  const required = [
    'scripts/check-step4.10-stock-reports.mjs',
    'scripts/check-step4.10.1-stock-reports-polish.mjs',
    'scripts/check-step4.10.2-stock-reports-drilldown.mjs',
    'scripts/check-step4.10.3-stock-reports-print-export-snapshot.mjs',
    'scripts/check-step4.10.4-stock-reports-final-qa-closure.mjs'
  ];
  for (const relative of required) {
    if (!fs.existsSync(path.join(process.cwd(), relative))) {
      throw new Error(`Missing closure smoke dependency: ${relative}`);
    }
  }
  console.log('OK: Step 4.10.4 static smoke passed. Set AUTOGRAND_SMOKE_URL for HTTP smoke.');
  process.exit(0);
}

const normalizedBase = baseUrl.replace(/\/$/, '');
const page = await request(`${normalizedBase}/stock-reports`, 'text/html');
if (!page.body.includes('data-stock-reports-root')) {
  throw new Error('/stock-reports did not render the stock reports root marker.');
}

const endpoints = [
  '/api/stock/reports/options?limit=10',
  '/api/stock/reports/summary?limit=10',
  '/api/stock/reports/balance?limit=10',
  '/api/stock/reports/movements?limit=10',
  '/api/stock/reports/item-ledger?limit=10',
  '/api/stock/reports/location-movements?limit=10',
  '/api/stock/reports/manager-snapshot?limit=10'
];

for (const endpoint of endpoints) {
  const response = await request(`${normalizedBase}${endpoint}`);
  const json = JSON.parse(response.body);
  if (json.ok !== true) throw new Error(`Endpoint did not return ok=true: ${endpoint}`);
  const cacheControl = String(response.headers['cache-control'] || '').toLowerCase();
  if (!cacheControl.includes('no-store')) {
    throw new Error(`Endpoint missing no-store cache header: ${endpoint}`);
  }
}

console.log('OK: Step 4.10.4 HTTP smoke passed.');
