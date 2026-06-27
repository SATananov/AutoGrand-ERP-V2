# AutoGrand ERP V2 — Step 2.5 Desktop Workspace Behavior

Дата: 2026-06-27

## Цел

Step 2.5 пренася само поведението на работната среда от стария `autogrand-erp-step1` към AutoGrand ERP V2.

Това не е промяна на бизнес логика, база, Prisma schema, services или routes процеси. Целта е V2 да запази реалната ERP основа от Step 2.4, но да се държи като desktop ERP среда:

- менюто отваря екрани като вътрешни ERP прозорци;
- всеки отворен екран получава tab;
- вече отворен екран се активира, вместо да се дублира;
- прозорците могат да се местят и оразмеряват;
- прозорците имат minimize / maximize / close;
- minimized прозорците се показват в dock долу;
- вътрешните форми се изпращат през workspace layer и остават в активния прозорец;
- вътрешните links отварят съответния V2 route като ERP прозорец;
- favicon пакетът от `autogrand-erp-step1` е добавен към V2.

## Променени файлове

- `src/server.js` — добавен partial render режим чрез `?workspace=1` / `X-AG-Workspace: 1`.
- `views/layouts/main.hbs` — добавен workspace stage, window layer, minimized dock, favicon links и workspace manager script.
- `public/js/app.js` — реорганизиран като reusable initializer за динамично заредени partial screens.
- `public/js/erp-v2-workspace-manager.js` — нов V2 behavior слой за MDI прозорци, tabs, меню, drag/resize и form submit вътре в прозорец.
- `public/css/styles.css` — добавени само structural behavior стилове за workspace layer.
- `public/manifest.webmanifest` — обновени favicon/icon entries.

## Добавени favicon/reference assets

- `public/favicon-16.png`
- `public/favicon-32.png`
- `public/favicon-48.png`
- `public/favicon-64.png`
- `public/favicon-128.png`
- `public/favicon-256.png`
- `public/favicon.ico`
- `public/favicon.svg`
- `public/img/autogrand-erp-mark.svg`
- `public/img/autogrand-road-mark.png`
- `public/img/autogrand-road-mark.svg`

## Непроменени области

- Prisma schema
- `prisma/dev.db`
- sales services
- purchase services
- document posting logic
- stock movement logic
- payment logic
- Step 2.4 health label

## Проверки

Изпълнени проверки:

```text
node --check src/server.js
node --check public/js/app.js
node --check public/js/erp-v2-workspace-manager.js
node scripts/check-project.mjs
```

Резултат: Step 2.4 check остава зелен, а Step 2.5 добавя само workspace behavior слой.
