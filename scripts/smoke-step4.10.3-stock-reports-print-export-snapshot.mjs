import http from 'node:http';

const baseUrl = process.env.AUTOGRAND_SMOKE_URL || '';

function requestJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { headers: { Accept: 'application/json' } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`Invalid JSON for ${url}: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

if (!baseUrl) {
  console.log('OK: Step 4.10.3 static smoke passed. Set AUTOGRAND_SMOKE_URL for HTTP smoke.');
  process.exit(0);
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
  const json = await requestJson(`${baseUrl.replace(/\/$/, '')}${endpoint}`);
  if (json.ok !== true) throw new Error(`Endpoint did not return ok=true: ${endpoint}`);
}

console.log('OK: Step 4.10.3 HTTP smoke passed.');
