# Checkpoint — Step 4.1 Company + Real AutoGrand Locations Foundation

## Статус

Step 4.1 е foundation checkpoint за реалните фирмени обекти на AutoGrand ERP V2.

## Какво е добавено

- Централизиран foundation файл: `src/data/autogrand-foundation.js`.
- Реална фирма: `Автогранд ООД`.
- Реални обекти от потвърдения списък.
- Стара Загора централен склад и Стара Загора регионален склад са отделни логически обекти.
- Кърджали е default работен обект за тестове.
- Обектите показват ясно продажби, складова наличност и трансферни роли.
- Health label е обновен към `4-1-company-real-locations-foundation`.
- Версията е `0.4.1`.

## Потвърдени правила

- Само Централен офис и Централен склад не продават.
- Всички обекти без Централния офис могат да заявяват, изпращат и приемат трансфери.
- Централният офис не участва в складови трансфери.

## Проверки

Очаквани проверки:

```powershell
node scripts/check-project.mjs
node --check src/server.js
node --check scripts/seed-prisma.js
node --check src/data/autogrand-foundation.js
node --check src/services/company-locations-service.js
```

След прилагане на patch-а върху локална база, за да се запишат реалните обекти в SQLite, се пуска:

```powershell
npm run db:seed
```

Това е development seed и reset-ва демо данните.
