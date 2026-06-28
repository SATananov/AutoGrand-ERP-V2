# AutoGrand ERP V2 — Step 4.7 Stock Engine Hardening

## Цел

Step 4.7 втвърдява складовото ядро след Global Document Engine и Global Print Engine. Логиката следва Moneta принципа: складът не е свободен текст в документа, а журнал от движения, който може да се провери, преизчисли и защити от повторно публикуване.

## Какво включва

- Централен `stock-engine-hardening-service` за прочит на складовия журнал.
- Автоматично откриване на Prisma модел за складови движения: `StockMovement`, `InventoryMovement` или сходен модел.
- Нормализиране на движение до подписано количество: входящо `+`, изходящо `-`.
- Snapshot по `item + location/object/warehouse`.
- Проверка за отрицателни наличности.
- Проверка за потенциално дублирани движения по документ, ред, артикул, обект, тип и количество.
- Guard функция `assertStockAvailability()` за продажби, експедиции, изписвания и бъдещи трансфери.
- Audit страница `/stock-hardening` и JSON endpoints: `/api/stock/hardening/audit`, `/api/stock/hardening/balances`.

## Moneta правила

1. Само публикуван/осчетоводен документ влияе на склада.
2. Един документен ред има един складов ефект.
3. Продажба/експедиция/изписване не минават без наличност, освен ако изрично не е разрешен отрицателен склад.
4. Наличността е винаги по обект/локация/склад.
5. Корекцията е обратен запис, не тихо изтриване.
6. Журналът е източникът на истината; справките се преизчисляват от него.

## Changed files

- `src/services/stock-engine-hardening-service.js`
- `src/routes/stock-hardening-routes.js`
- `views/pages/stock-hardening-audit.hbs`
- `public/css/styles.css`
- `src/server.js`
- `package.json`
- `package-lock.json`
- `views/partials/sidebar.hbs` if present
- `docs/steps/STEP_4_7_STOCK_ENGINE_HARDENING_BG.md`
- `docs/checkpoints/STEP_4_7_STOCK_ENGINE_HARDENING_CLEAN_EXPORT_BG.md`

## Smoke

```powershell
npm run check
node --check src/services/stock-engine-hardening-service.js
node --check src/routes/stock-hardening-routes.js
npm run dev
```

Open: `http://localhost:3000/stock-hardening`
