# Архитектура — AutoGrand ERP V2 Step 4.0

Проектът е Node.js / Express / Handlebars ERP shell с Prisma / SQLite база. След Step 3.5 има реален работещ складов трансферен flow, а Step 4.0 заключва архитектурната посока за цялата система.

## Текущи слоеве

```text
src/server.js                         Express app / routes
src/services/                         бизнес услуги по модули
src/data/                             navigation, ribbon, UI metadata
views/layouts/                        основен ERP shell
views/pages/                          работни екрани и документни карти
public/css/                           AutoGrand визуален стил
public/js/                            browser поведение, workspace, print dialogs
prisma/schema.prisma                  текуща база
scripts/seed-prisma.js                seed база
docs/reference/generated/             безопасни reference summary отчети
docs/reference/private/               локални private log extract-и
docs/blueprints/                      Step 4 архитектурни планове
```

## Reference принцип

Moneta/Client ZIP-овете не са runtime dependency. Не се копират `.exe`, `.bpl`, `.dll` и не се reverse-engineer-ва код. Те служат само като ориентир за ERP структура, терминология и работни процеси.

## Целева архитектура

AutoGrand ERP трябва постепенно да се подреди около общи двигатели:

```text
Core Engine
Document Engine
Stock Engine
Grid Engine
Print Engine
Permission Engine
Audit / History Engine
```

## Текущи домейн модели

Вече има основи за:

```text
Company
CompanyLocation
User
Counterparty
Item
Warehouse
PriceList
SalesDocument
PurchaseDocument
StockBalance
StockMovement
StockTransferDocument
StockAdjustmentDocument
CashEntry
Vehicle
ServiceOrder
```

## Следваща архитектурна стъпка

Step 4.1 трябва да заздрави foundation слоя: обекти, складове, потребители, роли, принтер профили, номератори и seed база.
