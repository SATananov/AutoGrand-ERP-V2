const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const sidebarPath = path.join(root, 'views', 'partials', 'sidebar.hbs');
const packagePath = path.join(root, 'package.json');

assert(fs.existsSync(sidebarPath), 'sidebar.hbs missing');
assert(fs.existsSync(packagePath), 'package.json missing');

const sidebar = fs.readFileSync(sidebarPath, 'utf8');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

assert(pkg.version === '0.4.41', `package version expected 0.4.41, got ${pkg.version}`);
assert(pkg.scripts && pkg.scripts['check:step4:12:4:1'], 'check:step4:12:4:1 script missing');

const requiredLabels = [
  '\u041c\u0435\u043d\u044e',
  '\u041f\u0440\u043e\u0434\u0430\u0436\u0431\u0438',
  '\u0414\u043e\u0441\u0442\u0430\u0432\u043a\u0438',
  '\u041d\u0430\u043b\u0438\u0447\u043d\u043e\u0441\u0442\u0438',
  '\u041f\u043b\u0430\u043d\u0438\u0440\u0430\u043d\u0435 \u043d\u0430 \u043d\u0430\u043b\u0438\u0447\u043d\u043e\u0441\u0442\u0438',
  '\u041f\u0440\u0435\u043f\u043e\u0440\u044a\u043a\u0438 \u0437\u0430 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0438',
  '\u041a\u043e\u043d\u0442\u0440\u043e\u043b \u043d\u0430 \u0441\u043a\u043b\u0430\u0434\u0430',
  '\u0421\u043f\u0440\u0430\u0432\u043a\u0438',
  '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438'
];
for (const label of requiredLabels) {
  assert(sidebar.includes(label), `sidebar missing expected Cyrillic label: ${label}`);
}

const forbiddenMarkers = [
  '\uFFFD', '\u0098', '????',
  '\u0420\u045a', '\u0420\u045f', '\u0420\u0491', '\u0420\u0405', '\u0420\u00b0', '\u0420\u00b5',
  '\u0420\u040e', '\u0420\u201d', '\u0420\u045c', '\u0420\u045b', '\u0420\u0402', '\u0420\u0459',
  '\u0420\u00a6', '\u0420\u201c', '\u0421\u201a', '\u0421\u040a', '\u0421\u0409', '\u0421\u0453',
  '\u0421\u2021', '\u0421\u2030', '\u0421\u0402'
];
for (const marker of forbiddenMarkers) {
  assert(!sidebar.includes(marker), `sidebar contains encoding marker: ${marker}`);
}

const requiredPaths = [
  'href="/stock-control"',
  'href="/inventory-planning"',
  'href="/inventory-planning/suppliers"'
];
for (const value of requiredPaths) {
  assert(sidebar.includes(value), `sidebar missing planning link: ${value}`);
}

console.log('OK: Step 4.12.4.1 shell menu Cyrillic encoding smoke markers passed.');
