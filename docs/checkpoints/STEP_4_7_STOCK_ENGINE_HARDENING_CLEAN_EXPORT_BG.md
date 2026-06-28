# AutoGrand ERP V2 — Step 4.7 Stock Engine Hardening — CLEAN EXPORT

## Статус

Patch artifact for Step 4.7.

## Health label

`4-7-stock-engine-hardening`

## Очакван резултат

- Проектът остава Moneta-like ERP shell.
- Складът вече има централен audit/guard слой.
- Съществуващите документи и печат не се чупят.
- Няма промяна в Prisma schema в тази стъпка; услугата работи върху наличния модел за движения.
- Ако моделът липсва или има различни имена, audit endpoint връща ясен contract error вместо silent failure.

## Проверки

- JS syntax check за новите файлове.
- JSON parse за `package.json` и `package-lock.json`.
- Mojibake scan за стандартните развалени Unicode/Cyrillic marker-и, без да ги записваме в документа като реален текст.
- `npm run check` when package script exists.
