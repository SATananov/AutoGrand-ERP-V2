# Step 4.13.1 — Login Screen Polish / Browser Title Encoding Repair

## Цел

Ремонт на login екрана след визуална проверка в браузър:

- премахва повредения Cyrillic/mojibake browser title;
- добавя отделен cache-busted login stylesheet `public/css/ag-login.css`;
- връща login страницата към завършен AutoGrand ERP вид, а не default HTML форма;
- синхронизира видимата версия към `v0.4.44`;
- добавя server-side UI title/status guard, който не позволява повреден текст да излиза в browser tab/status при стари route title стойности.

## Обхват

Променени файлове:

- `package.json`
- `src/server.js`
- `views/pages/login.hbs`
- `public/css/ag-login.css`
- `scripts/step-4-13-1-login-screen-polish-smoke.cjs`
- `docs/checkpoints/STEP_4_13_1_LOGIN_SCREEN_POLISH_BROWSER_TITLE_ENCODING_REPAIR_BG.md`

## Guardrails

Този repair не променя:

- purchase planning logic;
- inventory planning calculations;
- stock posting/reversal/correction logic;
- Prisma schema;
- seed данни;
- permissions за purchase/stock документи.

## Проверка

```powershell
npm run check:step4:13:1
npm run check:step4:13
npm run check
node --check src/server.js
```
