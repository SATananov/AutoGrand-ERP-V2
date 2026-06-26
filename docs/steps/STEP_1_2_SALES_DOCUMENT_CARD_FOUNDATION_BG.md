# AutoGrand ERP V2 — Step 1.2

## Име
Sales Document Card Foundation

## Какво добавя
- Route `/document/sales/:documentId`
- Moneta-like документна карта
- Header: тип, номер, дата, статус, контрагент, склад
- Lines grid: артикули, количества, цени, стойности
- Totals side panel
- Payments side panel
- Double-click от Sales browse към документна карта
- "Отвори карта" от preview panel

## Проверка
1. Отвори `/screen/offers`
2. Double-click върху реда
3. Или натисни "Отвори карта"
4. Очакван адрес: `/document/sales/<id>`