# AutoGrand ERP V2 — Step 4.7.4 Stock Audit Resolution View

## Цел

Step 4.7.4 надгражда Step 4.7 Stock Engine Hardening с работен изглед за решаване на откритите складови несъответствия.

## Moneta логика

- Отрицателната наличност не е просто warning, а блокиращ сигнал за проверка преди нови posting flows.
- Дублираният складов подпис показва възможно повторно осчетоводяване на един и същ документен ред.
- Корекцията не трябва да трие складов журнал. Трябва да има обратен запис или контрол срещу повторно публикуване.
- Наличността се гледа по артикул + обект/локация.

## Добавено

- Разширен `stock-engine-hardening-service.js` с normalized movement details.
- Нов `getStockAuditResolution()` service method.
- Нов API endpoint: `/api/stock/hardening/resolution`.
- Обновен `/stock-hardening` UI с таблици за:
  - отрицателни наличности;
  - последни свързани движения;
  - дублирани складови ефекти;
  - препоръчано действие.

## Проверка

```powershell
npm run check
npm run dev
```

Отвори:

```text
http://localhost:3000/stock-hardening
http://localhost:3000/api/stock/hardening/resolution
```
