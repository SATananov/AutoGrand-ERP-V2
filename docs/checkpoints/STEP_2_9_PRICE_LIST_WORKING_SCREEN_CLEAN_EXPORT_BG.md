# Clean Export Checkpoint — Step 2.9 Price List Working Screen

## Checkpoint

AutoGrand ERP V2 Step 2.9 добавя работен екран за ценова листа / артикули / наличности.

## Проверки

Очаквани проверки:

```powershell
node scripts/check-project.mjs
node --check src/server.js
node --check src/services/price-list-workbench-service.js
node --check public/js/app.js
node --check public/js/erp-v2-workspace-manager.js
npm run dev
```

## Какво да се тества

1. От меню Продажби → Ценова листа да се отвори новият екран.
2. Търсене по код/описание.
3. Само свободни в текущия обект.
4. Колони → включване/изключване и бързи изгледи.
5. Десен панел → наличности по обекти.
6. Снимка → качи, изтрий, запази като.
7. Долни менюта Артикул / Доставки / Продажби / Трансфер да показват ясни команди.

## Бележка

Снимките се съхраняват локално в `public/uploads/item-images/` с безопасно име по кода на артикула.
