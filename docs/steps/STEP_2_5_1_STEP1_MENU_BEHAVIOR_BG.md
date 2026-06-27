# AutoGrand ERP V2 — Step 2.5.1 Step1-like Menu Behavior

## Цел

Step 2.5.1 пренася само поведението и разположението на главното меню от `autogrand-erp-step1` към AutoGrand ERP V2.

Не се променят Prisma schema, базата, services или бизнес логиката от Step 2.4/2.5.

## Приложено

- главното меню вече използва пълното дървовидно меню от `autogrand-erp-step1`;
- налични са основните модули: Продажби, Доставки, Склад, Финанси и счетоводство, Номенклатури, Сервиз и поддръжка, Електронна търговия, Автомобили, Администриране, Бързи връзки;
- запазени са вложените папки: Номенклатури, История, Настройки, Справки и специфичните подпапки по модул;
- лявото меню има resizer дръжка за хоризонтално разтягане;
- има pin/кламер режим за заключване/отключване на ширината;
- има minimize/collapse бутон за скриване на менюто;
- при скрито меню се появява dock бутон „Меню“ в statusbar;
- горните модули работят като accordion — отворен е само един основен модул;
- бутоните имат tooltips/aria labels;
- десен бутон върху модул отваря контекстно меню с Отвори, Покажи отпред, Добави в Бързи връзки, Скрий менюто;
- реалните V2 екрани продължават да се зареждат през съществуващите routes;
- модулите без реална V2 логика се отварят като behavior-only placeholder прозорци, за да се запази desktop ERP усещането без да се измисля бизнес логика.

## Променени файлове

- `views/layouts/main.hbs`
- `views/partials/sidebar.hbs`
- `public/js/erp-v2-workspace-manager.js`
- `public/css/styles.css`
- `package.json`
- `docs/steps/STEP_2_5_1_STEP1_MENU_BEHAVIOR_BG.md`
- `docs/checkpoints/STEP_2_5_1_MENU_BEHAVIOR_CLEAN_EXPORT_BG.md`

## Проверки

```powershell
node --check src/server.js
node --check public/js/app.js
node --check public/js/erp-v2-workspace-manager.js
node scripts/check-project.mjs
```
