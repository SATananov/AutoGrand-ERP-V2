# AutoGrand ERP V2 — Step 2

## Име
Sales Real CRUD Foundation

## Какво добавя
- Нов продажбен документ
- Prisma create за SalesDocument
- Добавяне на ред в документ
- Избор на артикул
- Количество / цена / отстъпка
- Преизчисляване на totalNet / totalVat / totalGross
- Смяна на статус: DRAFT / POSTED / CANCELLED
- Route `/document/sales/new/:docType`
- POST routes за actions

## Проверка
1. Отвори `/screen/offers`
2. Натисни `Нов документ`
3. Създай оферта
4. В документа добави ред
5. Натисни `Преизчисли документа`
6. Смени статус на `Осчетоводи`