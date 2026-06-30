const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const ok = (message) => console.log(`OK: ${message}`);

function semverAtLeast(version, minimum) {
  const left = String(version || '').split('.').map((part) => Number(part));
  const right = String(minimum || '').split('.').map((part) => Number(part));
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const a = left[index] || 0;
    const b = right[index] || 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
}

const packageJson = JSON.parse(read('package.json'));
if (!semverAtLeast(packageJson.version, '0.4.44')) fail('package version must be >= 0.4.44');
else ok(`package version is ${packageJson.version}`);

if (!['4.13.1', '4.13.2'].includes(packageJson.autograndStep)) fail('autograndStep must remain compatible with Step 4.13.1 repair');
else ok(`autograndStep is ${packageJson.autograndStep}`);

const server = read('src/server.js');
const loginView = read('views/pages/login.hbs');
const loginCss = read('public/css/ag-login.css');

const loginRouteStart = server.indexOf("app.get('/login'");
const loginRouteEnd = server.indexOf("app.post('/login'", loginRouteStart);
const loginRoute = server.slice(loginRouteStart, loginRouteEnd);
const damagedPattern = /Р |РЎ|РЋ|Р†|вЂ|В¦|Вµ|Â|\ufffd|\?\?\?\?/;

if (!loginRoute.includes("title: 'Вход · AutoGrand ERP V2'")) fail('login browser title is not clean Bulgarian');
else ok('login browser title is clean');

if (damagedPattern.test(loginRoute)) fail('login route still contains visible encoding damage');
else ok('login route has no visible encoding damage');

if (!server.includes('UI_ENCODING_DAMAGE_PATTERN')) fail('server UI encoding guard is missing');
else ok('server UI encoding guard is present');

if (!server.includes("appVersion: 'v0.4.45'") && !server.includes("appVersion: 'v0.4.44'")) fail('server appVersion must remain synced after login repair');
else ok('server appVersion is synced');

if (!loginView.includes('/public/css/ag-login.css?v=4.13.1')) fail('isolated login stylesheet is not linked');
else ok('isolated login stylesheet is linked');

if (!loginView.includes('{{appVersion}} · работна версия')) fail('login view must render dynamic appVersion');
else ok('login version label is dynamic');

for (const token of ['.ag-login-shell', '.ag-login-brand-panel', '.ag-login-card', '.ag-login-submit']) {
  if (!loginCss.includes(token)) fail(`login CSS missing ${token}`);
  else ok(`login CSS contains ${token}`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log('STEP_4_13_1_LOGIN_SCREEN_POLISH_SMOKE_OK');
