# Checkpoint — Step 4.7.4 Stock Audit Resolution View

Step 4.7.4 добавя resolution слой върху Stock Engine Hardening.

## Очакван резултат

- `/stock-hardening` се зарежда в ERP shell-а.
- Страницата показва конкретни отрицателни наличности по артикул/обект.
- Страницата показва дублирани складови подписи по document/line/item/location/effect.
- API `/api/stock/hardening/resolution` връща machine-readable resolution payload.
- Няма директно изтриване или автоматична корекция на складови движения.

## Следваща логична стъпка

Step 4.7.5 може да добави controlled reversal draft/action, но само след визуална проверка на причината за всеки отрицателен баланс или дублаж.
