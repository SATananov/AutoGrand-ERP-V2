# Step 4.4 — Role Permissions Enforcement / Menu, Route & Action Guard

Версия: `0.4.6`

## Цел

Тази стъпка започва реалното прилагане на правата след Login Context от Step 4.3.
До момента системата знаеше кой е активният потребител, коя е активната роля и кой е активният обект.
Step 4.4 използва този контекст, за да пази менюта, директни URL-и и действия върху документи.

## Moneta-like принцип

Moneta не работи само с една проста роля от типа admin / manager / seller.
Логиката е по-близка до:

```text
Потребител
+ активен профил / роля
+ активен обект
+ права по форма / модул
+ права по действие
+ ограничения по данни / обект
```

Затова Step 4.4 добавя централен permission слой, който може да се развива към по-фина матрица без промяна на текущата Prisma схема.

## Добавено

### 1. Central permission service

Нов файл:

```text
src/services/permission-service.js
```

Той съдържа:

- role grant fallback правила;
- route правила;
- screen правила;
- command/menu правила;
- проверка за активен обект;
- помощни функции за филтриране на меню и ribbon;
- данни за 403 екрана;
- health label за Step 4.4.

### 2. Route guard

`src/server.js` вече има middleware след login context-а:

```text
authorizeRequest(req.agContext, ...)
```

Ако активният профил няма право, системата връща AutoGrand 403 екран вместо да изпълни route/action-а.

### 3. Menu / ribbon filtering

`renderPage()` вече филтрира:

```text
navigationGroups
ribbonGroups
```

Така менюто и командната лента започват да се съобразяват с активната роля.

### 4. Action guard

Пазят се не само GET екрани, а и POST/DELETE действия:

- създаване на продажбен документ;
- редакция на редове;
- приключване на документ;
- плащане;
- доставки;
- складови трансфери;
- складови корекции;
- снимка на артикул;
- snapshot инструменти;
- reference map.

### 5. Location-aware restrictions

Някои действия вече проверяват и флаговете от активния обект:

```text
canSell
canRequestTransfer
canDispatchTransfer
canReceiveTransfer
```

Пример: потребител с право за продажби, но в обект без `canSell`, няма да създаде продажбен документ.

### 6. Forbidden page

Нов файл:

```text
views/pages/forbidden.hbs
```

Екранът показва:

- активен потребител и роля;
- активен обект;
- заявен URL/action;
- нужно право;
- permission scope.

## Без Prisma schema промяна

Step 4.4 не променя базата. Той използва вече наличния Login Context и permissions от Step 4.2 / 4.3.

## Health label

```text
4-4-role-permissions-enforcement-menu-route-action-guard
```

## Очаквано поведение

- Admin вижда и може всичко.
- Manager вижда основните ERP модули и може да работи с продажби, доставки, склад и трансфери.
- Sales профилът е ограничен основно до продажби, цени, наличности и заявки.
- Cashier профилът е ограничен до плащания и преглед.
- Warehouse профилът е силен в склад и трансфери, но не получава автоматично пълни продажбени права.
- Директно въвеждане на забранен URL връща 403.

## Следваща логична стъпка

```text
Step 4.5 — Role-based Workspace Polish
```

Там може да се полира видимостта на конкретни бутони вътре в документните карти и да се добавят read-only режими по роля.
