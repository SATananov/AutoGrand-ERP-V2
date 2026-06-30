const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const EXPECTED_VERSION = '0.4.42';
const STALE_VERSION = 'v0.4.10';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const pkg = JSON.parse(readText('package.json'));
assert(pkg.version === EXPECTED_VERSION, `package version is ${pkg.version}, expected ${EXPECTED_VERSION}`);

const lock = JSON.parse(readText('package-lock.json'));
assert(lock.version === EXPECTED_VERSION, `package-lock root version is ${lock.version}, expected ${EXPECTED_VERSION}`);
if (lock.packages && lock.packages['']) {
  assert(lock.packages[''].version === EXPECTED_VERSION, `package-lock packages[""] version is ${lock.packages[''].version}, expected ${EXPECTED_VERSION}`);
}

const viewFiles = walk(path.join(ROOT, 'views')).filter((file) => /\.(hbs|html)$/i.test(file));
const runtimeFiles = viewFiles.concat(walk(path.join(ROOT, 'public')).filter((file) => /\.(js|css|html)$/i.test(file)));
const runtimeText = runtimeFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');

assert(!runtimeText.includes(STALE_VERSION), `stale ${STALE_VERSION} label still present in runtime views/public files`);
assert(runtimeText.includes(`v${EXPECTED_VERSION}`), `runtime version label v${EXPECTED_VERSION} missing`);

const loginCandidates = viewFiles.filter((file) => {
  const text = fs.readFileSync(file, 'utf8');
  return text.includes('Работен вход') || text.includes('Вход в системата') || text.includes('работна версия');
});
assert(loginCandidates.length > 0, 'login/version view candidate not found');

const mojibakeMarkers = ['Рњ', 'Рџ', 'Рґ', 'РЅ', 'Р°', 'Рµ', 'С‚', 'СЊ', 'СЉ', 'СЃ', '\uFFFD'];
for (const file of loginCandidates) {
  const text = fs.readFileSync(file, 'utf8');
  assert(text.includes(`v${EXPECTED_VERSION}`), `${path.relative(ROOT, file)} does not contain v${EXPECTED_VERSION}`);
  for (const marker of mojibakeMarkers) {
    assert(!text.includes(marker), `mojibake marker ${marker} found in ${path.relative(ROOT, file)}`);
  }
}

console.log('OK: Step 4.12.4.2 login screen version label sync smoke markers passed.');
