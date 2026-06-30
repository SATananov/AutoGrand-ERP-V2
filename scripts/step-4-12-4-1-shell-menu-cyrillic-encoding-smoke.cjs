const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const sidebarPath = path.join(root, 'views', 'partials', 'sidebar.hbs');
const packagePath = path.join(root, 'package.json');

assert(fs.existsSync(sidebarPath), 'sidebar partial missing');
assert(fs.existsSync(packagePath), 'package.json missing');

const sidebar = fs.readFileSync(sidebarPath, 'utf8');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

assert(pkg.version === '0.4.41', `package version expected 0.4.41, got ${pkg.version}`);
assert(pkg.scripts && pkg.scripts['check:step4:12:4:1'], 'Step 4.12.4.1 npm check script missing');

const requiredLabels = [
  '\u041c\u0435\u043d\u044e',
  '\u0413\u043b\u0430\u0432\u043d\u043e ERP \u043c\u0435\u043d\u044e',
  '\u041f\u0440\u043e\u0434\u0430\u0436\u0431\u0438',
  '\u0414\u043e\u0441\u0442\u0430\u0432\u043a\u0438',
  '\u041d\u043e\u043c\u0435\u043d\u043a\u043b\u0430\u0442\u0443\u0440\u0438',
  '\u0418\u0441\u0442\u043e\u0440\u0438\u044f',
  '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438',
  '\u0421\u043f\u0440\u0430\u0432\u043a\u0438',
  '\u041a\u043e\u043d\u0442\u0440\u043e\u043b \u043d\u0430 \u0441\u043a\u043b\u0430\u0434\u0430',
  '\u041f\u043b\u0430\u043d\u0438\u0440\u0430\u043d\u0435 \u043d\u0430 \u043d\u0430\u043b\u0438\u0447\u043d\u043e\u0441\u0442\u0438'
];
for (const label of requiredLabels) {
  assert(sidebar.includes(label), `sidebar missing Bulgarian label: ${label}`);
}

const forbiddenMarkers = [
  'Рњ', 'Рџ', 'Рґ', 'РЅ', 'Р°', 'Рµ', 'С‚', 'СЊ', 'СЉ', 'СЃ',
  'РЎ', 'Р”', 'Рќ', 'Рћ', 'Рђ', 'Рљ', 'Р¦', 'Р“', 'Р‘', '????', '\uFFFD', '\u0098'
];
for (const marker of forbiddenMarkers) {
  assert(!sidebar.includes(marker), `sidebar still contains encoding marker: ${JSON.stringify(marker)}`);
}

const readOnlyGuardrailTerms = [
  'inventory-planning',
  '/inventory-planning',
  'data-module-title'
];
for (const value of readOnlyGuardrailTerms) {
  assert(sidebar.includes(value), `sidebar missing expected navigation marker: ${value}`);
}

console.log('OK: Step 4.12.4.1 shell menu Cyrillic encoding smoke markers passed.');
