# AutoGrand ERP V2 — Step 4.7.1 Stock Hardening Route Repair

## Цел

Hotfix към Step 4.7, за да се гарантира, че `/stock-hardening` се монтира преди 404/fallback middleware и че страницата се рендерира безопасно дори ако складовият Prisma модел още не е разпознат.

## Поправки

- Премества `app.use(stockHardeningRoutes)` преди 404/fallback/error handlers.
- Премахва неправилно добавен raw sidebar link, когато е попаднал като син линк в работната зона.
- Добавя `/api/stock/hardening/ping` и `/api/stock/hardening/health`.
- Страницата вече показва диагностика вместо да пада при липсващ/различно именуван складов модел.

## Проверка

```powershell
npm run check
npm run dev
```

URL-и:

- `http://localhost:3000/stock-hardening`
- `http://localhost:3000/api/stock/hardening/ping`
- `http://localhost:3000/api/stock/hardening/audit`
