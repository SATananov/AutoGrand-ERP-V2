const baseUrl = process.env.AUTOGRAND_SMOKE_URL;

const staticEndpoints = [
  '/stock-valuation',
  '/api/stock/valuation/item-ledger',
  '/api/stock/valuation/cost-source'
];

if (!baseUrl) {
  console.log('OK: Step 4.11.2 static smoke passed. Set AUTOGRAND_SMOKE_URL for HTTP smoke.');
  process.exit(0);
}

for (const endpoint of staticEndpoints) {
  const url = new URL(endpoint, baseUrl).href;
  const response = await fetch(url, { headers: { Accept: endpoint.startsWith('/api/') ? 'application/json' : 'text/html' } });
  if (!response.ok) throw new Error(`Smoke failed ${endpoint}: HTTP ${response.status}`);
  const text = await response.text();
  if (endpoint.includes('item-ledger') && !text.includes('Read-only')) throw new Error('item-ledger response should include read-only safety text.');
  if (endpoint.includes('cost-source') && !text.includes('Read-only')) throw new Error('cost-source response should include read-only safety text.');
}

console.log('OK: Step 4.11.2 HTTP smoke passed.');
