# AutoGrand ERP Implementation Sequence — Step 4.0

## Фаза A — Подреждане на основата

### Step 4.1 — Core Master Data Foundation

Цел: да има стабилни номенклатури и seed база.

- Company cleanup;
- CompanyLocation cleanup;
- Warehouse cleanup;
- транзитен склад като системен обект;
- PrinterProfile модел/seed;
- DocumentNumbering план;
- начална seed структура.

### Step 4.2 — Users, Employees, Roles and Permissions

Цел: да знаем кой работи, от кой обект и какво има право да прави.

- Employee;
- Role;
- Permission;
- UserLocation;
- права за доставни цени, печат, публикуване, корекции.

### Step 4.3 — Items, Units, VAT, Prices and Suppliers Foundation

Цел: артикули и цени да не са само текстови полета.

- ItemGroup;
- UnitOfMeasure;
- VatGroup;
- Supplier link;
- ItemCostPrice;
- PriceList cleanup;
- import-ready структура.

### Step 4.4 — Demo Dataset / Working Test Base

Цел: реална тестова база.

- 100–200 примерни артикула;
- начални наличности по обекти;
- доставчици;
- клиенти;
- потребители;
- роли;
- примерни документи.

## Фаза B — Общи ERP двигатели

### Step 4.5 — Global Grid Column Preferences

- drag/drop колони;
- ширини;
- показване/скриване;
- запомняне на изглед.

### Step 4.6 — Global Document Pattern Cleanup

- единни статуси;
- общи действия;
- общи бутони;
- история;
- заключване.

### Step 4.7 — Global Print Forms Engine

- PrintForm;
- PrinterProfile;
- последен избор;
- формати по документ;
- print preview като общ компонент.

### Step 4.8 — Stock Engine Hardening

- свободно количество;
- резервирано;
- в път;
- очаквано;
- липса на рафт;
- коректни проверки при всички движения.

## Фаза C — Завършване на бизнес модулите

### Step 5.0 — Sales Completion

- продажбен документ;
- плащания;
- резервиране/изписване;
- печат;
- връщане от клиент.

### Step 6.0 — Purchases Completion

- заявка към доставчик;
- доставка;
- вход в склад;
- доставни цени;
- връщане към доставчик.

### Step 7.0 — Service / Vehicles Foundation

- клиентски автомобил;
- сервизна поръчка;
- части;
- труд;
- статуси;
- печат.

### Step 8.0 — Finance / Reports

- каса;
- плащания;
- задължения;
- справки;
- дневни отчети.
