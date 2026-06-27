# AutoGrand ERP — Moneta Reference Rebuild / Step 0.1

Това е **нов чист проект от нула**. Двата качени ZIP-а се използват като **reference база**, не като source code и не като копирани бинарни файлове.

Използвани reference файлове:

- `Client_REFERENCE_source-only_20260625_1447(4).zip`
- `ZipMasterR23.zip`

## Какво има вътре

- Node.js / Express / Handlebars стартов ERP shell
- зелена Moneta-like навигация и работна зона
- обединена карта на ERP модулите от двата reference ZIP-а
- Python инструмент: `tools/analyze_reference_zips.py`
- private log extract-и от твоя обект в `docs/reference/private/`
- безопасни summary отчети в `docs/reference/generated/`
- VS Code tasks

## Какво НЕ е включено

- няма `.exe`, `.bpl`, `.dll` от Client/Moneta ZIP-овете
- няма reverse-engineered код
- няма копирана Moneta логика
- няма база данни още — това е foundation/reference етап

## Важно за private логовете

Понеже логовете са от твоя реален обект, ги изкарахме отделно в:

```text
docs/reference/private/
```

Тази папка е **само за локална работа**. Не я качвай в GitHub и не я публикувай. `.gitignore` вече е настроен да пази CSV файловете от тази private папка извън Git.

Файлове:

```text
docs/reference/private/private_log_diagnostic_lines.csv
docs/reference/private/private_log_identifiers.csv
docs/reference/private/README_PRIVATE_BG.md
```

## Бърз старт във VS Code

1. Свали ZIP-а на Desktop.
2. Разархивирай го в отделна папка на Desktop.
3. Отвори папката във VS Code.
4. В терминала пусни:

```powershell
npm install
npm run dev
```

5. Отвори:

```text
http://localhost:3000
```

## Ако двата reference ZIP-а са на Desktop

Постави ги на Desktop със следните имена:

```text
Client_REFERENCE_source-only_20260625_1447(4).zip
ZipMasterR23.zip
```

После можеш да регенерираш reference картата:

```powershell
npm run analyze:references
```

И проверка:

```powershell
npm run check
```

## Текущ reference резултат

- source ZIP-ове: **2**
- общо ZIP записи: **1612**
- уникални BPL packages: **345**
- mapped ERP modules: **17**
- log files: **200**
- matched diagnostic lines: **78174**
- bad CRC: **няма**
- dangerous paths: **0**

## Следваща стъпка

Step 1 трябва да създаде реалните core entities: Клиенти, Артикули, Складове, Ценови листи, Документи, Продажби, Доставки.

## Текущ checkpoint

Step 2.6 — Stock Module Foundation. Стабилният Desktop ERP Shell от Step 2.5.7 остава основа, а складът получава реален модул: складов център, карти на артикул и склад, ръчни корекции и трансфери между складове.



## Step 2.6.1 — Обекти, складове и търговски локации

Добавена е единна SQL/Prisma основа за обектите на AutoGrand: централен офис, централен склад, регионални складове и търговски обекти. Активният работен обект е Кърджали. След прилагане на patch-а изпълни `npm run db:generate`, защото има нов Prisma модел `CompanyLocation`.


## Step 2.6.2 — Stock Shell Menu Sync + Ribbon Guard

Този checkpoint запазва Step 2.6.1 Company Locations / Stock Foundation и поправя видимия desktop shell:

- синхронизира лявото Step1-like меню със складовите V2 routes;
- добавя видим вход „Обекти и складове“ под „Склад“;
- добавя „Складов център“, „Наличности“, „Складова корекция“, „Нов трансфер“ и „История трансфери“ в лявото меню;
- добавя route mapping за новите складови меню елементи в workspace manager-а;
- заключва ribbon височината и предотвратява визуално разместване;
- добавя cache-bust към CSS/JS asset-ите, за да не остане стар shell в браузъра.

Бизнес логиката, Prisma моделите и складовите операции от Step 2.6.1 не са променяни.


## Step 2.6.3 — Regional Warehouse Sales Role Fix

Step 2.6.3 коригира реалната роля на обектите: регионалните складове на AutoGrand също работят с продажби. Само централният офис и единственият централен склад са без продажби. KPI картата вече показва „Обекти с продажби“ вместо подвеждащо „Търговски обекти“.

## Step 2.7 — Stock Transfer Document Card

Step 2.7 превръща складовия трансфер от директно действие в реален ERP документ:

- нови Prisma модели `StockTransferDocument` и `StockTransferLine`;
- нов трансфер се създава като Чернова;
- има документна карта с редове, складови движения, история и бележки;
- редовете могат да се добавят, редактират и изтриват само в Чернова;
- публикуването проверява наличностите и създава OUT/IN складови движения;
- публикуван или отказан трансфер се заключва;
- списъкът „История трансфери“ вече отваря карта на трансфер документ.

След прилагане на patch-а изпълни `npm run db:generate`, защото има нови Prisma модели.

## Step 2.8 — Stock Adjustment Document Card

Добавен е реален документ за складова корекция с чернова, редове, публикуване, отказ, заключване и складови движения. Корекциите вече не са директно действие, а ERP документна карта.


## Step 2.8.1 — Stock Adjustment Wording Polish

Приет е малък UX polish за складовата корекция: менюто и формите вече обясняват ясно кога се използва документът — намерена стока на рафт, липса, брак, начално салдо или друга официална промяна на наличността.

## Текущ checkpoint

**Step 2.9 — Price List Working Screen**

Добавен е работен екран за артикули, цени, наличности, снимка на артикул и видими колони. Екранът е достъпен от:

```text
/price-list
```

и от меню:

```text
Продажби → Ценова листа
```
