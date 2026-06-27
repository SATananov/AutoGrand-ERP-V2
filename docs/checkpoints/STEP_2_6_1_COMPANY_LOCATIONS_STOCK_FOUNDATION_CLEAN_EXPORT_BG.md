# Clean Export — Step 2.6.1 Company Locations / Stock Foundation

Clean checkpoint за AutoGrand ERP V2 Step 2.6.1.

## Съдържание

Добавя:

- `CompanyLocation` Prisma модел;
- migration `202606271455_step_2_6_1_company_locations`;
- връзка `Warehouse.locationId`;
- реални AutoGrand обекти в seed/dev.db;
- `/locations`;
- `/locations/:locationId`;
- service `src/services/company-locations-service.js`;
- визуални карти за обекти;
- меню входове към „Обекти и складове“.

## Clean правила

ZIP-ът не съдържа:

- `.git`;
- `node_modules`;
- `.env`;
- временни patch/cache файлове;
- nested ZIP файлове.

Включва:

- `.env.example`;
- `prisma/dev.db` за локален checkpoint;
- migration и schema.

## След прилагане

```powershell
npm run db:generate
node scripts/check-project.mjs
npm run dev
```
