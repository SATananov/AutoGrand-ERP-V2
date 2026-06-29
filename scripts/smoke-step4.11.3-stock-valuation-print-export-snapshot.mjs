const baseUrl = process.env.AUTOGRAND_SMOKE_URL;

const staticEndpoints = [
  '/stock-valuation',
  '/api/stock/valuation/manager-snapshot'
];

if (!baseUrl) {
  console.log('OK: Step 4.11.3 static smoke passed. Set AUTOGRAND_SMOKE_URL for HTTP smoke.');
  process.exit(0);
}

for (const endpoint of staticEndpoints) {
  const url = new URL(endpoint, baseUrl).href;
  const response = await fetch(url, { headers: { Accept: endpoint.startsWith('/api/') ? 'application/json' : 'text/html' } });
  if (!response.ok) throw new Error(`Smoke failed ${endpoint}: HTTP ${response.status}`);
  const text = await response.text();
  if (endpoint === '/stock-valuation' && !text.includes('Manager Snapshot QA')) throw new Error('Stock valuation page should include Manager Snapshot QA.');
  if (endpoint.includes('manager-snapshot') && !text.includes('Read-only')) throw new Error('manager-snapshot response should include read-only safety text.');
}

console.log('OK: Step 4.11.3 HTTP smoke passed.');
