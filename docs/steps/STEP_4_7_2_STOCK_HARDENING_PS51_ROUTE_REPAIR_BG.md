# AutoGrand ERP V2 — Step 4.7.2 Stock Hardening PowerShell 5.1 Route Repair

## Цел

Step 4.7.2 е поправка на apply механизма за Step 4.7.1. Причината е, че Windows PowerShell 5.1 може да парсне нестабилно embedded JavaScript here-string при определени encoding/clipboard сценарии.

## Какво прави

- Прилага отново безопасните changed-files за Step 4.7.1.
- Монтира `stockHardeningRoutes` преди 404/fallback/error handlers.
- Запазва `/api/stock/hardening/ping`, `/api/stock/hardening/audit` и `/stock-hardening`.
- Поправя CSS блока на страницата.
- Използва PowerShell-only patch за `src/server.js`, без embedded JavaScript here-string.

## Проверка

```powershell
npm run check
npm run dev
```

URL-и:

- `http://localhost:3000/api/stock/hardening/ping`
- `http://localhost:3000/stock-hardening`
