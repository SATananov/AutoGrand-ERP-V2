# AutoGrand ERP V2 — Step 4.8 Stock Correction / Adjustment Document Foundation

## Цел

Step 4.8 добавя Moneta-подобна основа за складови корекции. След Step 4.7 вече виждаме отрицателни наличности и потенциални дублирани складови ефекти. Тази стъпка добавя документна рамка, през която тези проблеми да се коригират безопасно.

## Moneta логика

- Корекцията е отделен документ, не ръчна редакция на складовия журнал.
- Старите движения не се изтриват тихо.
- Реална поправка се прави чрез нов входящ, изходящ или обратен складов ефект.
- Всеки ред има артикул, обект/локация, количество, причина и бъдещ posting policy.
- Документът започва като `DRAFT`; реалното осчетоводяване трябва да бъде еднократно и заключващо.

## Добавени части

- `src/data/stock-adjustment-foundation.js`
- `src/services/stock-adjustment-service.js`
- `src/routes/stock-adjustment-routes.js`
- `views/pages/stock-adjustments.hbs`
- `/stock-adjustments`
- `/api/stock/adjustments/foundation`
- `/api/stock/adjustments/preview`
- `/api/stock/adjustments/from-issue`

## Обхват

Тази стъпка умишлено е foundation/preview. Тя не трие складови движения и не записва реални корекции в база, ако няма подходящ Prisma модел. Следваща подстъпка може да добави реална таблица, номерация, save/post и еднократен lock.
