# AutoGrand ERP V2 — Step 1.4

## Име
Global Moneta Module Foundation

## Какво добавя
- Доставки: поръчки към доставчици, фактури доставчици, доставки, плащания доставки
- Склад: наличности, движения, трансфери
- Финанси: каса и плащания
- Номенклатури: контрагенти, артикули, групи артикули
- Сервиз: сервизни поръчки
- Автомобили: регистър и връзка със сервиз
- Prisma модели за purchase, stock, service
- Seed данни за всички основни модули

## Команди
npx prisma migrate dev --name step_1_4_global_modules
npm run db:seed
node scripts/check-project.mjs
npm run dev