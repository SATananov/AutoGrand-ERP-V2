import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'src/services/stock-valuation-service.js',
  'src/routes/stock-valuation-routes.js',
  'views/pages/stock-valuation.hbs',
  'public/js/stock-valuation.js',
  'public/css/stock-valuation.css',
  'docs/reference/step4.11.1-stock-valuation-ui-polish-cost-confidence-manager-filters.md'
];

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) throw new Error(`Missing required file: ${relativePath}`);
  return fs.readFileSync(fullPath, 'utf8');
}

for (const file of requiredFiles) read(file);

const routes = read('src/routes/stock-valuation-routes.js');
const service = read('src/services/stock-valuation-service.js');
const page = read('views/pages/stock-valuation.hbs');
const client = read('public/js/stock-valuation.js');

const forbiddenRouteWrites = /router\s*\.\s*(post|put|patch|delete)\s*\(/i;
if (forbiddenRouteWrites.test(routes)) throw new Error('Stock valuation route must stay GET-only.');

const forbiddenStockWrites = /\.(create|update|upsert|delete|deleteMany|updateMany)\s*\(/;
if (forbiddenStockWrites.test(service)) throw new Error('Stock valuation service must not call Prisma write methods.');

for (const token of [
  'confidenceMode',
  'managerFocus',
  'valueBand',
  'costConfidenceLevel',
  'managerFlag',
  'getCostConfidenceLevel',
  'passesManagerFilters'
]) {
  if (!service.includes(token) && !page.includes(token) && !client.includes(token)) {
    throw new Error(`Missing Step 4.11.1 token: ${token}`);
  }
}

if (!routes.includes('X-AutoGrand-Read-Only')) throw new Error('Missing read-only response header.');
if (!page.includes('data-valuation-period')) throw new Error('Missing quick period buttons.');
if (!client.includes('confidenceBadge')) throw new Error('Missing confidence badge renderer.');
if (!client.includes('valuation-badge')) throw new Error('Missing badge UI output.');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8').replace(/^\uFEFF/, ''));
const versionParts = String(pkg.version || '').split('.').map((part) => Number(part));
const versionNumber = (versionParts[0] * 10000) + (versionParts[1] * 100) + versionParts[2];
const minimumVersionNumber = (0 * 10000) + (4 * 100) + 32;
if (!Number.isFinite(versionNumber) || versionNumber < minimumVersionNumber) {
  throw new Error(`Expected package version >= 0.4.32, got ${pkg.version}`);
}

console.log('OK: Step 4.11.1 stock valuation UI polish / cost confidence checks passed.');
