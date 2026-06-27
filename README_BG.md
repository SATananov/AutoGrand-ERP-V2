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

**Step 2.4 — Purchases / Deliveries / Stock IN**

Текущата версия добавя реална доставна документна карта, нов доставен документ, CRUD на доставни редове и осчетоводяване на доставки/фактури доставчици към складови движения `PURCHASE_IN`.

Проверка:

```powershell
node scripts/check-project.mjs
```

Очакван резултат:

```text
OK: Step 2.4 Purchases / Deliveries / Stock IN patch check passed.
```


- Step 2.5.6 — Ribbon Command Layout + Snapshot: горната командна лента е подредена по Moneta-подобна ERP логика с AutoGrand визия, ясни различни икони и бутон „Снимка“ за заснемане/копиране на екрана, без нова ERP бизнес логика.
